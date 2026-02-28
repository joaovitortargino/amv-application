package br.com.oficina.application.service;

import br.com.oficina.application.dto.FinancialReportDTO;
import br.com.oficina.application.dto.FinancialTitleFilterDTO;
import br.com.oficina.application.dto.ServiceOrderResponseDTO;
import br.com.oficina.domain.entities.Client;
import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.FinancialType;
import br.com.oficina.domain.enums.PaymentMethod;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.FinancialTitleRepository;
import br.com.oficina.shared.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinancialTitleService {
	private final FinancialTitleRepository repository;
	private final UserContext userContext;
	private final ServiceOrderService serviceOrderService;
	private final ClientService clientService;
	private final AuditService auditService;

	@Transactional
	public FinancialTitle createTitleFromServiceOrders(List<UUID> osIds) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		
		if (osIds == null || osIds.isEmpty()) {
			throw new IllegalArgumentException("List of OS IDs cannot be empty");
		}

		List<ServiceOrderResponseDTO> orders = osIds.stream()
				.map(serviceOrderService::findById)
				.toList();

		String firstClientId = orders.get(0).clientId();
		boolean allSameClient = orders.stream().allMatch(os -> os.clientId().equals(firstClientId));
		
		if (!allSameClient) {
			throw new IllegalArgumentException("All Service Orders must belong to the same client");
		}

		Client client = clientService.findById(UUID.fromString(firstClientId));

		BigDecimal totalValue = orders.stream()
				.map(os -> os.totals().total())
				.reduce(BigDecimal.ZERO, BigDecimal::add);

		FinancialTitle title = new FinancialTitle();
		title.setEnterpriseId(enterpriseId);
		title.setDescription("Título Agrupado - " + orders.size() + " Ordens de Serviço");
		title.setType(FinancialType.INCOME);
		title.setCategory("Serviços Oficina");
		title.setOriginalValue(totalValue);
		title.setDueDate(LocalDate.now()); // Vencimento padrão
		title.setCompetenceDate(LocalDate.now());
		title.setStatus(FinancialTitleStatus.OPEN);
		title.setPaymentMethod(PaymentMethod.BANK_SLIP); // Default
		title.setClientId(client.getId());
		
		String osNumbers = orders.stream().map(ServiceOrderResponseDTO::osNumber).collect(Collectors.joining(", "));
		title.setOsId(osNumbers);
		
		initializeValues(title);
		FinancialTitle savedTitle = repository.save(title);
		
		osIds.forEach(osId -> serviceOrderService.markAsBilled(osId, savedTitle.getId()));
		
		auditService.log("CREATE", "FinancialTitle", savedTitle.getId().toString(), "Created batch title from OSs: " + osNumbers);
		
		return savedTitle;
	}

	public FinancialTitle createManualTitle(FinancialTitle title) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		validateTitle(title);
		
		if (title.getId() == null) title.setId(UUID.randomUUID());
		title.setEnterpriseId(enterpriseId);
		
		if (title.getStatus() == null) title.setStatus(FinancialTitleStatus.OPEN);
		if (title.getCompetenceDate() == null) title.setCompetenceDate(LocalDate.now());
		initializeValues(title);
		
		FinancialTitle savedTitle = repository.save(title);
		
		auditService.log("CREATE", "FinancialTitle", savedTitle.getId().toString(), "Created manual title: " + savedTitle.getDescription());
		
		return savedTitle;
	}
	
	public Page<FinancialTitle> listAll(FinancialTitleFilterDTO filter, Pageable pageable) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		Page<FinancialTitle> page;

		if (filter.description() != null && !filter.description().isBlank()) {
			page = repository.searchByDescription(filter.description(), enterpriseId, pageable);
		} else {
			boolean hasType = filter.type() != null;
			boolean hasStatus = filter.status() != null;
			boolean hasDueDate = filter.dueDateStart() != null && filter.dueDateEnd() != null;
			boolean hasCompetence = filter.competenceDateStart() != null && filter.competenceDateEnd() != null;

			if (hasCompetence && !hasType && hasStatus) {
				page = repository.findByEnterpriseIdAndCompetenceDateBetween(
						enterpriseId, filter.competenceDateStart(), filter.competenceDateEnd(), pageable);
			} else if (hasType && hasStatus && hasDueDate) {
				page = repository.findByEnterpriseIdAndTypeAndStatusAndDueDateBetween(
						enterpriseId, filter.type(), filter.status(),
						filter.dueDateStart(), filter.dueDateEnd(), pageable);
			} else if (hasType && hasDueDate) {
				page = repository.findByEnterpriseIdAndTypeAndDueDateBetween(
						enterpriseId, filter.type(), filter.dueDateStart(), filter.dueDateEnd(), pageable);
			} else if (hasStatus && hasDueDate) {
				page = repository.findByEnterpriseIdAndStatusAndDueDateBetween(
						enterpriseId, filter.status(), filter.dueDateStart(), filter.dueDateEnd(), pageable);
			} else if (hasDueDate) {
				page = repository.findByEnterpriseIdAndDueDateBetweenInclusive(
						enterpriseId, filter.dueDateStart(), filter.dueDateEnd(), pageable);
			} else if (hasType && hasStatus) {
				page = repository.findByEnterpriseIdAndTypeAndStatus(
						enterpriseId, filter.type(), filter.status(), pageable);
			} else if (hasType) {
				page = repository.findByEnterpriseIdAndType(enterpriseId, filter.type(), pageable);
			} else if (hasStatus) {
				page = repository.findByEnterpriseIdAndStatus(enterpriseId, filter.status(), pageable);
			} else {
				page = repository.findByEnterpriseId(enterpriseId, pageable);
			}
		}
		
		// Verifica atrasos antes de retornar
		page.forEach(this::checkAndUpdateDelay);
		return page;
	}

	public List<FinancialTitle> findAllOpenPayables() {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		List<FinancialTitle> list = repository.findByEnterpriseIdAndStatusAndDueDateBefore(enterpriseId, FinancialTitleStatus.OPEN, LocalDate.now());
		list.forEach(this::checkAndUpdateDelay);
		return list;
	}

	public FinancialTitle findById(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		FinancialTitle title = repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new BusinessException("Financial Title not found with ID: " + id));
		checkAndUpdateDelay(title);
		return title;
	}
	
	private void checkAndUpdateDelay(FinancialTitle title) {
		if (title.getDueDate() != null && 
			title.getStatus() == FinancialTitleStatus.OPEN && 
			title.getDueDate().isBefore(LocalDate.now())) {
			
			title.setStatus(FinancialTitleStatus.DELAYED);
			repository.save(title); // Atualiza no banco
		}
	}
	
	@Transactional
	public FinancialTitle updateTitle(UUID id, FinancialTitle updatedData) {
		FinancialTitle existingTitle = findById(id);

		if (isFinalStatus(existingTitle.getStatus())) {
			throw new BusinessException("Cannot edit a title that is already PAID or CANCELED. Please reverse it first.");
		}

		existingTitle.setDescription(updatedData.getDescription());
		existingTitle.setDueDate(updatedData.getDueDate());
		existingTitle.setOriginalValue(updatedData.getOriginalValue());
		existingTitle.setCategory(updatedData.getCategory());
		existingTitle.setPaymentMethod(updatedData.getPaymentMethod());
		
		// Se a data de vencimento mudou, revalida o status
		if (existingTitle.getDueDate() != null && 
		   (existingTitle.getDueDate().isAfter(LocalDate.now()) || existingTitle.getDueDate().isEqual(LocalDate.now()))) {
			if (existingTitle.getStatus() == FinancialTitleStatus.DELAYED) {
				existingTitle.setStatus(FinancialTitleStatus.OPEN);
			}
		}

		FinancialTitle savedTitle = repository.save(existingTitle);
		
		auditService.log("UPDATE", "FinancialTitle", savedTitle.getId().toString(), "Updated title details");
		
		return savedTitle;
	}

	@Transactional
	public FinancialTitle markAsPaid(UUID id, BigDecimal paidValue, LocalDate paymentDate, boolean isPartialPayment) {
		FinancialTitle title = findById(id);

		if (isFinalStatus(title.getStatus())) {
			throw new BusinessException("Title is already processed (Paid or Cancelled)");
		}

		BigDecimal actualPaidValue = (paidValue != null && paidValue.compareTo(BigDecimal.ZERO) > 0)
				? paidValue
				: title.getOriginalValue();

		LocalDate actualPaymentDate = (paymentDate != null) ? paymentDate : LocalDate.now();

		if (actualPaidValue.compareTo(title.getOriginalValue()) >= 0) {
			return processFullPayment(title, actualPaidValue, actualPaymentDate);
		}

		if (isPartialPayment) {
			return processPartialPayment(title, actualPaidValue, actualPaymentDate);
		}

		throw new BusinessException(
				"Paid value is less than the original value. If this is intentional, set isPartialPayment = true."
		);
	}

	private FinancialTitle processPartialPayment(FinancialTitle title, BigDecimal paidAmount, LocalDate paymentDate) {
		BigDecimal remaining = title.getOriginalValue().subtract(paidAmount);

		title.setStatus(FinancialTitleStatus.PAID);
		title.setPaymentDate(paymentDate);
		title.setPaidValue(paidAmount);
		title.setDiscount(BigDecimal.ZERO);
		title.setInterest(BigDecimal.ZERO);
		FinancialTitle paidTitle = repository.save(title);

		FinancialTitle remainingTitle = new FinancialTitle();
		remainingTitle.setEnterpriseId(title.getEnterpriseId());
		remainingTitle.setClientId(title.getClientId());
		remainingTitle.setDescription("Saldo restante - " + title.getDescription());
		remainingTitle.setType(title.getType());
		remainingTitle.setCategory(title.getCategory());
		remainingTitle.setOriginalValue(remaining);
		remainingTitle.setDueDate(title.getDueDate());
		remainingTitle.setCompetenceDate(LocalDate.now());
		remainingTitle.setStatus(FinancialTitleStatus.OPEN);
		remainingTitle.setPaymentMethod(title.getPaymentMethod());
		remainingTitle.setOsId(title.getOsId());
		initializeValues(remainingTitle);
		repository.save(remainingTitle);

		auditService.log("UPDATE", "FinancialTitle", paidTitle.getId().toString(),
		                 "Partial payment of " + paidAmount + ". New title created with remaining: " + remaining);

		return paidTitle;
	}

	private FinancialTitle processFullPayment(FinancialTitle title, BigDecimal paidAmount, LocalDate paymentDate) {
		title.setStatus(FinancialTitleStatus.PAID);
		title.setPaymentDate(paymentDate);
		title.setPaidValue(paidAmount);

		if (paidAmount.compareTo(title.getOriginalValue()) > 0) {
			title.setInterest(paidAmount.subtract(title.getOriginalValue()));
			title.setDiscount(BigDecimal.ZERO);
		} 
		else if (paidAmount.compareTo(title.getOriginalValue()) < 0) {
			title.setDiscount(title.getOriginalValue().subtract(paidAmount));
			title.setInterest(BigDecimal.ZERO);
		} else {
			title.setDiscount(BigDecimal.ZERO);
			title.setInterest(BigDecimal.ZERO);
		}

		FinancialTitle savedTitle = repository.save(title);
		
		auditService.log("UPDATE", "FinancialTitle", savedTitle.getId().toString(), "Marked as PAID. Value: " + paidAmount);
		
		return savedTitle;
	}

	@Transactional
	public FinancialTitle reversePayment(UUID id) {
		FinancialTitle title = findById(id);

		if (!FinancialTitleStatus.PAID.equals(title.getStatus())) {
			throw new BusinessException("Only PAID titles can be reversed");
		}

		title.setStatus(FinancialTitleStatus.OPEN);
		title.setPaymentDate(null);
		title.setPaidValue(BigDecimal.ZERO);
		title.setInterest(BigDecimal.ZERO);
		title.setDiscount(BigDecimal.ZERO);
		
		// Revalida se está atrasado ao reverter
		checkAndUpdateDelay(title);

		FinancialTitle savedTitle = repository.save(title);
		
		auditService.log("UPDATE", "FinancialTitle", savedTitle.getId().toString(), "Reversed payment");
		
		return savedTitle;
	}

	@Transactional
	public void cancelTitle(UUID id) {
		FinancialTitle title = findById(id);
		if (FinancialTitleStatus.PAID.equals(title.getStatus())) {
			throw new BusinessException("Cannot cancel a PAID title. Reverse it first.");
		}
		title.setStatus(FinancialTitleStatus.CANCELED);
		repository.save(title);
		
		auditService.log("UPDATE", "FinancialTitle", title.getId().toString(), "Cancelled title");
	}
	
	private void validateTitle(FinancialTitle title) {
		if (title.getOriginalValue() == null || title.getOriginalValue().compareTo(BigDecimal.ZERO) <= 0) {
			throw new BusinessException("Value must be greater than zero");
		}
		if (title.getDescription() == null || title.getDescription().isBlank()) {
			throw new BusinessException("Description is required");
		}
	}

	private void initializeValues(FinancialTitle title) {
		if (title.getPaidValue() == null) title.setPaidValue(BigDecimal.ZERO);
		if (title.getDiscount() == null) title.setDiscount(BigDecimal.ZERO);
		if (title.getInterest() == null) title.setInterest(BigDecimal.ZERO);
	}
	
	private boolean isFinalStatus(FinancialTitleStatus status) {
		return FinancialTitleStatus.PAID.equals(status) || FinancialTitleStatus.CANCELED.equals(status);
	}

	public Page<FinancialTitle> listByType(FinancialType type, Pageable pageable) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		Page<FinancialTitle> page = repository.findByEnterpriseIdAndType(enterpriseId, type, pageable);
		page.forEach(this::checkAndUpdateDelay);
		return page;
	}
	
	public FinancialReportDTO generateReportData(LocalDate startDate, LocalDate endDate) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		
		List<FinancialTitle> titles = repository.findByEnterpriseIdAndCompetenceDateBetween(
				enterpriseId, startDate, endDate);
		
		BigDecimal totalIncome = titles.stream()
				.filter(t -> t.getType() == FinancialType.INCOME)
				.map(FinancialTitle::getOriginalValue)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		
		BigDecimal totalExpense = titles.stream()
				.filter(t -> t.getType() == FinancialType.EXPENSE)
				.map(FinancialTitle::getOriginalValue)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
		
		BigDecimal balance = totalIncome.subtract(totalExpense);
		
		return new FinancialReportDTO(startDate, endDate, totalIncome, totalExpense, balance, titles);
	}
}
