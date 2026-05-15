package br.com.oficina.application.service;

import br.com.oficina.domain.entities.Client;
import br.com.oficina.domain.entities.Enterprise;
import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.entities.ItauConfig;
import br.com.oficina.domain.entities.ServiceOrder;
import br.com.oficina.domain.entities.Slips;
import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.SlipSourceType;
import br.com.oficina.domain.enums.SlipStatus;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.integration.itau.ItauService;
import br.com.oficina.infrastructure.persistence.FinancialTitleRepository;
import br.com.oficina.infrastructure.persistence.ServiceOrderRepository;
import br.com.oficina.infrastructure.persistence.SlipsRepository;
import br.com.oficina.shared.exceptions.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SlipsService {
	private final SlipsRepository slipsRepository;
	private final FinancialTitleRepository financialTitleRepository;
	private final UserContext userContext;
	private final ClientService clientService;
	private final ItauService itauService;
	private final FinancialTitleService financialTitleService;
	private final ItauConfigService itauConfigService;
	private final EnterpriseService enterpriseService;
	private final ServiceOrderRepository serviceOrderRepository;
	private final BarcodeService barcodeService;
	private final AuditService auditService;

	@Transactional
	public Slips createSlipFromTitle(UUID titleId) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		
		// 1. Busca o Título Financeiro
		FinancialTitle title = financialTitleService.findById(titleId);

		if (!isBlank(title.getSlipId())) {
			try {
				return findById(UUID.fromString(title.getSlipId()));
			} catch (Exception ignored) {
				title.setSlipId(null);
			}
		}
		
		if (title.getStatus() != FinancialTitleStatus.OPEN && title.getStatus() != FinancialTitleStatus.DELAYED) {
			throw new BusinessException("Only OPEN or DELAYED titles can have a slip generated.");
		}
		
		// 2. Busca o Cliente
		Client client = clientService.findById(UUID.fromString(String.valueOf(title.getClientId())));

		// 3. Cria o Boleto (Slip)
		Slips slip = new Slips();
		slip.setEnterpriseId(enterpriseId);
		slip.setPayerId(client.getId());
		slip.setPayerName(client.getName());
		slip.setPayerDocument(client.getDocument());
		
		slip.setValue(title.getOriginalValue());
		slip.setDueDate(title.getDueDate());
		slip.setDateIssuance(LocalDate.now());
		slip.setStatus(SlipStatus.PENDING);
		slip.setSourceType(isBlank(title.getOsId()) ? SlipSourceType.MANUAL : SlipSourceType.SERVICE_ORDER);
		slip.setSourceId(title.getId()); 
		slip.setOurNumber(generateOurNumber()); 

		// 4. Integração com o Itaú
		slip = itauService.emitirBoleto(slip, client, title);

		Slips savedSlip = slipsRepository.save(slip);
		
		// 5. Vincula o ID do boleto ao título
		title.setSlipId(savedSlip.getId().toString());
		financialTitleRepository.save(title);
		linkSlipToServiceOrders(title, savedSlip);
		
		auditService.log("CREATE", "Slip", savedSlip.getId().toString(), "Generated slip for Title " + titleId);
		
		return savedSlip;
	}

	public Page<Slips> searchSlips(
			LocalDate dueDateStart,
			LocalDate dueDateEnd,
			List<SlipStatus> statuses,
			String payerInfo,
			Pageable pageable
	) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return slipsRepository.search(enterpriseId, dueDateStart, dueDateEnd, statuses, payerInfo, pageable);
	}

	public Slips findById(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return slipsRepository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new BusinessException("Slip not found"));
	}

	@Transactional
	public Slips syncItauStatus(UUID id) {
		Slips slip = findById(id);
		if (isBlank(slip.getIdBoletoIndividual()) && isBlank(slip.getOurNumber())) {
			throw new BusinessException("Este boleto ainda nao possui identificador do Itau para consulta.");
		}
		Slips syncedSlip = syncSlipWithItau(slip);
		auditService.log("UPDATE", "Slip", syncedSlip.getId().toString(), "Synced slip status with Itau");
		return syncedSlip;
	}

	@Transactional
	public void syncProductionSlips() {
		List<ItauConfig> productionConfigs = itauConfigService.listActiveProductionConfigs();
		if (productionConfigs.isEmpty()) {
			return;
		}

		List<SlipStatus> syncStatuses = List.of(SlipStatus.PENDING, SlipStatus.REGISTERED, SlipStatus.OVERDUE);
		for (ItauConfig config : productionConfigs) {
			List<Slips> slips = slipsRepository.findSynchronizableByEnterpriseId(config.getEnterpriseId(), syncStatuses);
			for (Slips slip : slips) {
				try {
					syncSlipWithItau(slip);
				} catch (Exception e) {
					log.warn("Falha ao sincronizar boleto {} da empresa {}", slip.getId(), config.getEnterpriseId(), e);
					slip.setLastItauSyncAt(LocalDateTime.now());
					slip.setLastItauSyncError(truncate(e.getMessage(), 500));
					slipsRepository.save(slip);
				}
			}
		}
	}

	public Map<String, Object> buildPrintVariables(UUID id) {
		Slips slip = findById(id);
		if (isBlank(slip.getDigitableLine()) || isBlank(slip.getBarCode())) {
			throw new BusinessException("Boleto ainda nao possui linha digitavel e codigo de barras retornados pelo Itau.");
		}

		FinancialTitle title = financialTitleRepository.findById(slip.getSourceId()).orElse(null);
		Client client = null;
		try {
			client = clientService.findById(slip.getPayerId());
		} catch (Exception ignored) {
			client = null;
		}

		Enterprise enterprise = enterpriseService.getCurrentEnterprise();
		List<ServiceOrder> orders = findOrdersForTitle(title, slip.getEnterpriseId());
		List<String> orderNumbers = buildOrderNumbers(title, orders);

		Map<String, Object> variables = new HashMap<>();
		variables.put("slip", slip);
		variables.put("title", title);
		variables.put("client", client);
		variables.put("enterprise", enterprise);
		variables.put("itauConfig", itauConfigService.getConfigByEnterpriseId(slip.getEnterpriseId()));
		variables.put("orders", orders);
		variables.put("orderNumbers", orderNumbers);
		variables.put("barcode", barcodeService.generateItfBase64(slip.getBarCode()));
		variables.put("formattedBarCode", formatBarCode(slip.getBarCode()));
		return variables;
	}

	@Transactional
	public Slips cancelSlip(UUID id) {
		Slips slip = findById(id);

		if (slip.getStatus() == SlipStatus.PAID || slip.getStatus() == SlipStatus.CANCELED) {
			throw new BusinessException("Cannot cancel a slip that is already paid or cancelled.");
		}

		slip.setStatus(SlipStatus.CANCELED);
		
		financialTitleRepository.findById(slip.getSourceId()).ifPresent(title -> {
			title.setStatus(FinancialTitleStatus.CANCELED);
			financialTitleRepository.save(title);
		});

		Slips savedSlip = slipsRepository.save(slip);
		
		auditService.log("UPDATE", "Slip", savedSlip.getId().toString(), "Cancelled slip");
		
		return savedSlip;
	}

	@Transactional
	public Slips markAsPaidManually(UUID id, LocalDate paymentDate, BigDecimal paidValue) {
		Slips slip = findById(id);

		if (slip.getStatus() == SlipStatus.PAID) {
			throw new BusinessException("Slip is already paid.");
		}

		slip.setStatus(SlipStatus.PAID);
		slip.setPaymentDate(paymentDate);
		
		financialTitleRepository.findById(slip.getSourceId()).ifPresent(title -> {
			title.setStatus(FinancialTitleStatus.PAID);
			title.setPaymentDate(paymentDate);
			title.setPaidValue(paidValue != null ? paidValue : slip.getValue());
			financialTitleRepository.save(title);
		});

		Slips savedSlip = slipsRepository.save(slip);
		
		auditService.log("UPDATE", "Slip", savedSlip.getId().toString(), "Marked slip as PAID manually");
		
		return savedSlip;
	}

	private Slips syncSlipWithItau(Slips slip) {
		JsonNode response = itauService.consultarBoletoItau(slip);
		applyItauResponse(slip, response);
		Slips savedSlip = slipsRepository.save(slip);
		updateTitleFromSlip(savedSlip);
		return savedSlip;
	}

	private void applyItauResponse(Slips slip, JsonNode response) {
		if (response == null || response.isNull()) {
			throw new BusinessException("Consulta Itau nao retornou dados para o boleto.");
		}

		JsonNode boletoNode = findBestBoletoNode(response, slip);
		String itauStatus = findFirstText(boletoNode, "situacao_geral_boleto", "situacao_boleto", "situacao");
		String dueStatus = findFirstText(boletoNode, "status_vencimento");
		LocalDate paymentDate = parseDate(findFirstText(
				boletoNode,
				"data_inclusao_pagamento",
				"data_pagamento",
				"data_liquidacao",
				"data_credito"
		));
		BigDecimal paidValue = parseMoney(findFirstText(
				boletoNode,
				"valor_pago_total_cobranca",
				"valor_pago_total",
				"valor_pago",
				"valor_recebido"
		));

		String barCode = findFirstText(boletoNode, "codigo_barras", "codigoBarras");
		String digitableLine = findFirstText(boletoNode, "numero_linha_digitavel", "linha_digitavel", "linhaDigitavel");
		String ourNumber = findFirstText(boletoNode, "numero_nosso_numero", "nosso_numero", "nossoNumero");
		String idBoleto = findFirstText(boletoNode, "id_boleto_individual", "id_boleto", "idBoletoIndividual", "idBoleto");

		if (!isBlank(barCode)) {
			slip.setBarCode(barCode);
		}
		if (!isBlank(digitableLine)) {
			slip.setDigitableLine(digitableLine);
		}
		if (!isBlank(ourNumber)) {
			slip.setOurNumber(ourNumber);
		}
		if (!isBlank(idBoleto)) {
			slip.setIdBoletoIndividual(idBoleto);
		}

		slip.setItauStatus(itauStatus);
		slip.setItauDueStatus(dueStatus);
		slip.setLastItauSyncAt(LocalDateTime.now());
		slip.setLastItauSyncError(null);

		SlipStatus newStatus = resolveSlipStatus(slip, boletoNode, itauStatus, dueStatus, paymentDate, paidValue);
		slip.setStatus(newStatus);
		if (newStatus == SlipStatus.PAID) {
			slip.setPaymentDate(paymentDate != null ? paymentDate : LocalDate.now());
			slip.setPaidValue(paidValue != null ? paidValue : slip.getValue());
		}
	}

	private void updateTitleFromSlip(Slips slip) {
		financialTitleRepository.findById(slip.getSourceId()).ifPresent(title -> {
			if (slip.getStatus() == SlipStatus.PAID) {
				title.setStatus(FinancialTitleStatus.PAID);
				title.setPaymentDate(slip.getPaymentDate());
				title.setPaidValue(slip.getPaidValue() != null ? slip.getPaidValue() : slip.getValue());
				financialTitleRepository.save(title);
				return;
			}

			if (slip.getStatus() == SlipStatus.OVERDUE && title.getStatus() == FinancialTitleStatus.OPEN) {
				title.setStatus(FinancialTitleStatus.DELAYED);
				financialTitleRepository.save(title);
			}
		});
	}

	private SlipStatus resolveSlipStatus(
			Slips slip,
			JsonNode boletoNode,
			String itauStatus,
			String dueStatus,
			LocalDate paymentDate,
			BigDecimal paidValue
	) {
		String normalizedStatus = normalize(itauStatus);
		String normalizedDueStatus = normalize(dueStatus);
		String normalizedPayload = normalize(boletoNode.toString());

		boolean hasPaidValue = paidValue != null && paidValue.compareTo(BigDecimal.ZERO) > 0;
		boolean paid = containsAny(normalizedStatus, "paga", "pago", "liquid")
				|| containsAny(normalizedPayload, "titulo liquidado", "liquidado")
				|| paymentDate != null
				|| hasPaidValue;
		if (paid) {
			return SlipStatus.PAID;
		}

		boolean canceled = containsAny(normalizedStatus, "cancel", "baixa", "baixad")
				|| containsAny(normalizedPayload, "cancelado", "baixado", "baixada");
		if (canceled) {
			return SlipStatus.CANCELED;
		}

		boolean overdue = containsAny(normalizedDueStatus, "vencida", "vencido")
				|| (slip.getDueDate() != null && slip.getDueDate().isBefore(LocalDate.now()));
		if (overdue) {
			return SlipStatus.OVERDUE;
		}

		return SlipStatus.REGISTERED;
	}

	private JsonNode findBestBoletoNode(JsonNode response, Slips slip) {
		JsonNode data = response.get("data");
		if (data != null && data.isArray()) {
			for (JsonNode item : data) {
				if (matchesSlip(item, slip)) {
					return item;
				}
			}
			if (!data.isEmpty()) {
				return data.get(0);
			}
		}
		if (data != null && data.isObject()) {
			return data;
		}
		return response;
	}

	private boolean matchesSlip(JsonNode node, Slips slip) {
		String idBoleto = findFirstText(node, "id_boleto_individual", "id_boleto", "idBoletoIndividual", "idBoleto");
		if (!isBlank(slip.getIdBoletoIndividual()) && slip.getIdBoletoIndividual().equals(idBoleto)) {
			return true;
		}

		String ourNumber = findFirstText(node, "numero_nosso_numero", "nosso_numero", "nossoNumero");
		return !isBlank(slip.getOurNumber()) && normalizeNumber(slip.getOurNumber()).equals(normalizeNumber(ourNumber));
	}

	private String findFirstText(JsonNode node, String... fieldNames) {
		if (node == null || node.isNull()) {
			return null;
		}

		if (node.isObject()) {
			for (String fieldName : fieldNames) {
				JsonNode value = node.get(fieldName);
				if (value != null && !value.isNull() && value.isValueNode()) {
					return value.asText();
				}
			}

			Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
			while (fields.hasNext()) {
				Map.Entry<String, JsonNode> entry = fields.next();
				for (String fieldName : fieldNames) {
					if (entry.getKey().equalsIgnoreCase(fieldName)
							&& entry.getValue() != null
							&& !entry.getValue().isNull()
							&& entry.getValue().isValueNode()) {
						return entry.getValue().asText();
					}
				}
				String found = findFirstText(entry.getValue(), fieldNames);
				if (!isBlank(found)) {
					return found;
				}
			}
		}

		if (node.isArray()) {
			for (JsonNode child : node) {
				String found = findFirstText(child, fieldNames);
				if (!isBlank(found)) {
					return found;
				}
			}
		}

		return null;
	}

	private LocalDate parseDate(String value) {
		if (isBlank(value)) {
			return null;
		}
		String normalized = value.trim();
		if (normalized.length() >= 10) {
			normalized = normalized.substring(0, 10);
		}
		for (DateTimeFormatter formatter : List.of(DateTimeFormatter.ISO_LOCAL_DATE, DateTimeFormatter.ofPattern("dd/MM/yyyy"))) {
			try {
				return LocalDate.parse(normalized, formatter);
			} catch (Exception ignored) {
			}
		}
		return null;
	}

	private BigDecimal parseMoney(String value) {
		if (isBlank(value)) {
			return null;
		}
		String normalized = value.trim();
		if (normalized.contains(",")) {
			normalized = normalized.replace(".", "").replace(",", ".");
		} else if (!normalized.contains(".") && normalized.matches("\\d{3,}")) {
			return new BigDecimal(normalized).movePointLeft(2);
		}
		try {
			return new BigDecimal(normalized);
		} catch (Exception ignored) {
			return null;
		}
	}

	private String normalize(String value) {
		if (value == null) {
			return "";
		}
		return Normalizer.normalize(value, Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "")
				.toLowerCase(Locale.ROOT);
	}

	private boolean containsAny(String value, String... fragments) {
		for (String fragment : fragments) {
			if (value.contains(fragment)) {
				return true;
			}
		}
		return false;
	}

	private String normalizeNumber(String value) {
		if (value == null) {
			return "";
		}
		String digits = value.replaceAll("\\D", "");
		return digits.replaceFirst("^0+(?!$)", "");
	}
	
	private String generateOurNumber() {
		return String.valueOf(System.currentTimeMillis()).substring(5);
	}

	private void linkSlipToServiceOrders(FinancialTitle title, Slips slip) {
		List<ServiceOrder> orders = findOrdersForTitle(title, slip.getEnterpriseId());

		for (ServiceOrder order : orders) {
			List<String> slipsIds = order.getSlipsId() == null ? new ArrayList<>() : new ArrayList<>(order.getSlipsId());
			if (!slipsIds.contains(slip.getId().toString())) {
				slipsIds.add(slip.getId().toString());
				order.setSlipsId(slipsIds);
				serviceOrderRepository.save(order);
			}
		}
	}

	private List<ServiceOrder> findOrdersForTitle(FinancialTitle title, UUID enterpriseId) {
		if (title == null) {
			return List.of();
		}

		Map<UUID, ServiceOrder> ordersById = new LinkedHashMap<>();
		serviceOrderRepository.findByEnterpriseIdAndFinancialTitleId(enterpriseId, title.getId())
				.forEach(order -> addOrder(ordersById, order, enterpriseId));

		if (title.getServiceOrderIds() != null && !title.getServiceOrderIds().isEmpty()) {
			serviceOrderRepository.findAllById(title.getServiceOrderIds())
					.forEach(order -> addOrder(ordersById, order, enterpriseId));
		}

		if (ordersById.isEmpty() && !isBlank(title.getOsId())) {
			for (String osNumber : title.getOsId().split(",")) {
				serviceOrderRepository.findByEnterpriseIdAndOSnumber(enterpriseId, osNumber.trim())
						.ifPresent(order -> addOrder(ordersById, order, enterpriseId));
			}
		}

		return new ArrayList<>(ordersById.values());
	}

	private void addOrder(Map<UUID, ServiceOrder> ordersById, ServiceOrder order, UUID enterpriseId) {
		if (order != null && enterpriseId.equals(order.getEnterpriseId())) {
			ordersById.put(order.getId(), order);
		}
	}

	private List<String> buildOrderNumbers(FinancialTitle title, List<ServiceOrder> orders) {
		List<String> orderNumbers = new ArrayList<>();
		for (ServiceOrder order : orders) {
			addOrderNumber(orderNumbers, order.getOSnumber());
		}
		if (title != null && !isBlank(title.getOsId())) {
			for (String osNumber : title.getOsId().split(",")) {
				addOrderNumber(orderNumbers, osNumber.trim());
			}
		}
		return orderNumbers;
	}

	private void addOrderNumber(List<String> orderNumbers, String osNumber) {
		if (!isBlank(osNumber) && !orderNumbers.contains(osNumber)) {
			orderNumbers.add(osNumber);
		}
	}

	private String formatBarCode(String value) {
		if (value == null) {
			return "";
		}
		return value.replaceAll("(\\d{4})(?=\\d)", "$1 ");
	}

	private String truncate(String value, int maxLength) {
		if (value == null) {
			return null;
		}
		return value.length() <= maxLength ? value : value.substring(0, maxLength);
	}

	private boolean isBlank(String value) {
		return value == null || value.isBlank();
	}
}
