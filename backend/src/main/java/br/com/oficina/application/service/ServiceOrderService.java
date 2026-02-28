package br.com.oficina.application.service;

import br.com.oficina.application.dto.ItemOSRequestDTO;
import br.com.oficina.application.dto.ServiceOrderReportDTO;
import br.com.oficina.application.dto.ServiceOrderRequestDTO;
import br.com.oficina.application.dto.ServiceOrderResponseDTO;
import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.entities.Mechanic;
import br.com.oficina.domain.entities.ServiceOrder;
import br.com.oficina.domain.enums.StatusOS;
import br.com.oficina.domain.vo.FinancialTotals;
import br.com.oficina.domain.vo.ItemOS;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.FinancialTitleRepository;
import br.com.oficina.infrastructure.persistence.MechanicRepository;
import br.com.oficina.infrastructure.persistence.ServiceOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ServiceOrderService {
	private final ServiceOrderRepository repository;
	private final CommissionService commissionService;
	private final ClientService clientService;
	private final UserContext userContext;
	private final AuditService auditService;
	private final FinancialTitleRepository financialTitleRepository;
	private final FinancialTitleService financialTitleService;
	private final MechanicRepository mechanicRepository;

	public ServiceOrderService(
			ServiceOrderRepository repository,
			CommissionService commissionService,
			ClientService clientService,
			UserContext userContext,
			AuditService auditService,
			FinancialTitleRepository financialTitleRepository,
			@Lazy FinancialTitleService financialTitleService, // Injeção Lazy para quebrar o ciclo
			MechanicRepository mechanicRepository
	) {
		this.repository = repository;
		this.commissionService = commissionService;
		this.clientService = clientService;
		this.userContext = userContext;
		this.auditService = auditService;
		this.financialTitleRepository = financialTitleRepository;
		this.financialTitleService = financialTitleService;
		this.mechanicRepository = mechanicRepository;
	}

	@Transactional
	public ServiceOrderResponseDTO create(ServiceOrderRequestDTO dto) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		
		clientService.findById(UUID.fromString(dto.clientId()));

		ServiceOrder newOS = new ServiceOrder();
		newOS.setEnterpriseId(enterpriseId);
		newOS.setClientId(dto.clientId());
		newOS.setVehicle(dto.vehicle());
		newOS.setForecastDate(dto.forecastDate());
		newOS.setObservations(dto.observations());
		newOS.setOSnumber(genarateOSNumber());
		newOS.setStatus(StatusOS.OPEN);
		newOS.setCreatedAt(LocalDateTime.now());

		if (dto.items() != null && !dto.items().isEmpty()) {
			List<ItemOS> items = dto.items().stream().map(itemDto -> {
				BigDecimal total = itemDto.amount().multiply(itemDto.unitValue())
				                          .subtract(itemDto.discount() != null ? itemDto.discount() : BigDecimal.ZERO);
				
				Long mechanicCode = null;
				if (itemDto.mechanicId() != null) {
					Mechanic mechanic = mechanicRepository.findById(itemDto.mechanicId()).orElse(null);
					if (mechanic != null) {
						mechanicCode = mechanic.getMechanicCode();
					}
				}

				return new ItemOS(
						itemDto.productServiceId(),
						itemDto.type(),
						itemDto.name(),
						itemDto.amount(),
						itemDto.unitValue(),
						itemDto.discount() != null ? itemDto.discount() : BigDecimal.ZERO,
						total,
						itemDto.mechanicId(),
						mechanicCode
				);
			}).collect(Collectors.toList());
			newOS.setItemOS(new ArrayList<>(items));
			recalculateTotals(newOS);
		} else {
			newOS.setItemOS(new ArrayList<>());
			newOS.setTotals(FinancialTotals.reset());
		}
		
		newOS = repository.save(newOS);
		
		auditService.log("CREATE", "ServiceOrder", newOS.getId().toString(), "Created OS " + newOS.getOSnumber());
		
		return toResponseDTO(newOS);
	}

	@Transactional
	public ServiceOrderResponseDTO addItem(UUID osId, ItemOSRequestDTO itemDto) {
		ServiceOrder os = findEntityById(osId);
		validateEditableStatus(os);
		
		// Calcula o total do item
		BigDecimal total = itemDto.amount().multiply(itemDto.unitValue())
				.subtract(itemDto.discount() != null ? itemDto.discount() : BigDecimal.ZERO);
		
		Long mechanicCode = null;
		if (itemDto.mechanicId() != null) {
			Mechanic mechanic = mechanicRepository.findById(itemDto.mechanicId()).orElse(null);
			if (mechanic != null) {
				mechanicCode = mechanic.getMechanicCode();
			}
		}
		
		ItemOS item = new ItemOS(
				itemDto.productServiceId(),
				itemDto.type(),
				itemDto.name(),
				itemDto.amount(),
				itemDto.unitValue(),
				itemDto.discount() != null ? itemDto.discount() : BigDecimal.ZERO,
				total,
				itemDto.mechanicId(),
				mechanicCode
		);
		
		os.getItemOS().add(item);
		recalculateTotals(os);

		os = repository.save(os);
		
		auditService.log("UPDATE", "ServiceOrder", os.getId().toString(), "Added item " + item.name() + " to OS " + os.getOSnumber());
		
		return toResponseDTO(os);
	}

	@Transactional
	public ServiceOrderResponseDTO removeItem(UUID osId, int itemIndex) {
		ServiceOrder os = findEntityById(osId);
		validateEditableStatus(os);
		
		if (itemIndex < 0 || itemIndex >= os.getItemOS().size()) {
			throw new IllegalArgumentException("Invalid item index");
		}
		
		ItemOS removedItem = os.getItemOS().get(itemIndex);
		os.getItemOS().remove(itemIndex);
		recalculateTotals(os);
		
		os = repository.save(os);
		
		auditService.log("UPDATE", "ServiceOrder", os.getId().toString(), "Removed item " + removedItem.name() + " from OS " + os.getOSnumber());
		
		return toResponseDTO(os);
	}

	@Transactional
	public ServiceOrderResponseDTO finish(UUID id) {
		ServiceOrder os = findEntityById(id);
		validateEditableStatus(os);

		if (os.getItemOS().isEmpty()) {
			throw new IllegalStateException("Service order must have at least one item");
		}

		commissionService.calculateAndSaveCommissions(os);

		os.setStatus(StatusOS.FINISHED);
		os.setCompletionDate(LocalDateTime.now());
		os.setUpdatedAt(LocalDateTime.now());
		os = repository.save(os);

		try {
			FinancialTitle title = financialTitleService.createTitleFromServiceOrders(Collections.singletonList(os.getId()));
		} catch(Exception e) {
			auditService.log("ERROR", "ServiceOrder", os.getId().toString(),
			                 "Failed to create financial title: " + e.getMessage());
		}

		os = repository.findById(os.getId()).orElse(os);
		
		auditService.log("UPDATE", "ServiceOrder", os.getId().toString(), "Finished OS " + os.getOSnumber());
		
		return toResponseDTO(os);
	}

	@Transactional
	public ServiceOrderResponseDTO cancel(UUID id) {
		ServiceOrder os = findEntityById(id);

		if (os.getStatus() == StatusOS.FINISHED) {
			throw new IllegalArgumentException("Service order is already finished");
		}

		os.setStatus(StatusOS.CANCELED);
		os.setUpdatedAt(LocalDateTime.now());

		os = repository.save(os);
		
		auditService.log("UPDATE", "ServiceOrder", os.getId().toString(), "Cancelled OS " + os.getOSnumber());
		
		return toResponseDTO(os);
	}

	public List<ServiceOrderResponseDTO> listAll(LocalDate startDate, LocalDate endDate) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		List<ServiceOrder> orders;

		if (startDate != null && endDate != null) {
			orders = repository.findByEnterpriseIdAndCreatedAtBetween(enterpriseId, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
		} else {
			orders = repository.findByEnterpriseId(enterpriseId);
		}

		return orders.stream()
				.map(this::toResponseDTO)
				.collect(Collectors.toList());
	}
	
	public List<ServiceOrderResponseDTO> listByClient(UUID clientId) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return repository.findByEnterpriseIdAndClientIdOrderByCreatedAtDesc(enterpriseId, clientId.toString()).stream()
				.map(this::toResponseDTO)
				.collect(Collectors.toList());
	}

	@Transactional
	public void markAsBilled(UUID osId, UUID financialTitleId) {
		ServiceOrder os = findEntityById(osId);
		if (os.getFinancialTitleId() != null) {
			throw new IllegalStateException("Service Order " + os.getOSnumber() + " is already billed.");
		}
		os.setFinancialTitleId(financialTitleId);
		repository.save(os);
		
		auditService.log("UPDATE", "ServiceOrder", os.getId().toString(), "Billed OS " + os.getOSnumber() + " with Title " + financialTitleId);
	}
	
	public ServiceOrderResponseDTO findById(UUID id) {
		return toResponseDTO(findEntityById(id));
	}

	public ServiceOrder findEntityById(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new RuntimeException("Service order not found"));
	}
	
	public ServiceOrderReportDTO generateReportData(LocalDate startDate, LocalDate endDate) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		
		List<ServiceOrder> orders = repository.findByEnterpriseIdAndCreatedAtBetween(
				enterpriseId, startDate.atStartOfDay(), endDate.plusDays(1).atStartOfDay());
		
		long totalOrders = orders.size();
		long finishedOrders = orders.stream().filter(os -> os.getStatus() == StatusOS.FINISHED).count();
		long openOrders = orders.stream().filter(os -> os.getStatus() == StatusOS.OPEN || os.getStatus() == StatusOS.IN_PROGRESS).count();
		long canceledOrders = orders.stream().filter(os -> os.getStatus() == StatusOS.CANCELED).count();
		
		List<ServiceOrderResponseDTO> orderDTOs = orders.stream()
				.map(this::toResponseDTO)
				.collect(Collectors.toList());
		
		return new ServiceOrderReportDTO(startDate, endDate, totalOrders, finishedOrders, openOrders, canceledOrders, orderDTOs);
	}

	private void validateEditableStatus(ServiceOrder os) {
		if (os.getStatus() == StatusOS.FINISHED || os.getStatus() == StatusOS.CANCELED) {
			throw new IllegalStateException("Service order is not editable");
		}
	}

	private void recalculateTotals(ServiceOrder os) {
		BigDecimal subtotal = BigDecimal.ZERO;
		BigDecimal discounts = BigDecimal.ZERO;

		for (ItemOS item : os.getItemOS()) {
			subtotal = subtotal.add(item.amount().multiply(item.unitValue()));
			discounts = discounts.add(item.discount() != null ? item.discount() : BigDecimal.ZERO);
		}

		BigDecimal taxes = BigDecimal.ZERO;

		BigDecimal total = subtotal.subtract(discounts).add(taxes);

		os.setTotals(new FinancialTotals(subtotal, discounts, taxes, total));
	}

	public String genarateOSNumber() {
		return "OS-" + System.currentTimeMillis();
	}
	
	private ServiceOrderResponseDTO toResponseDTO(ServiceOrder os) {
		FinancialTitle financialTitle = null;
		if (os.getFinancialTitleId() != null) {
			financialTitle = financialTitleRepository.findById(os.getFinancialTitleId()).orElse(null);
		}

		return new ServiceOrderResponseDTO(
				os.getId(),
				os.getOSnumber(),
				os.getClientId(),
				os.getVehicle(),
				os.getItemOS(),
				os.getTotals(),
				os.getStatus(),
				os.getCreatedAt(),
				os.getForecastDate(),
				os.getCompletionDate(),
				os.getObservations(),
				financialTitle
		);
	}
}
