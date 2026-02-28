package br.com.oficina.application.service;

import br.com.oficina.domain.entities.Client;
import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.entities.Slips;
import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.SlipSourceType;
import br.com.oficina.domain.enums.SlipStatus;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.integration.itau.ItauService;
import br.com.oficina.infrastructure.persistence.FinancialTitleRepository;
import br.com.oficina.infrastructure.persistence.SlipsRepository;
import br.com.oficina.shared.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SlipsService {
	private final SlipsRepository slipsRepository;
	private final FinancialTitleRepository financialTitleRepository;
	private final UserContext userContext;
	private final ClientService clientService;
	private final ItauService itauService;
	private final FinancialTitleService financialTitleService;
	private final AuditService auditService;

	@Transactional
	public Slips createSlipFromTitle(UUID titleId) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		
		// 1. Busca o Título Financeiro
		FinancialTitle title = financialTitleService.findById(titleId);
		
		if (title.getStatus() != FinancialTitleStatus.OPEN) {
			throw new BusinessException("Only OPEN titles can have a slip generated.");
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
		slip.setSourceType(SlipSourceType.MANUAL); // Ou poderia ser OS
		slip.setSourceId(title.getId()); 
		slip.setOurNumber(generateOurNumber()); 

		// 4. Integração com o Itaú
		slip = itauService.emitirBoleto(slip, client);

		Slips savedSlip = slipsRepository.save(slip);
		
		// 5. Vincula o ID do boleto ao título
		title.setSlipId(savedSlip.getId().toString());
		financialTitleRepository.save(title);
		
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
	
	private String generateOurNumber() {
		return String.valueOf(System.currentTimeMillis()).substring(5);
	}
}
