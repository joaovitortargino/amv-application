package br.com.oficina.application.service;

import br.com.oficina.domain.entities.Commissions;
import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.entities.Mechanic;
import br.com.oficina.domain.entities.ServiceOrder;
import br.com.oficina.domain.enums.CommissionStatus;
import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.FinancialType;
import br.com.oficina.domain.enums.PaymentMethod;
import br.com.oficina.domain.enums.TypeItem;
import br.com.oficina.domain.vo.ItemOS;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.CommissionsRepository;
import br.com.oficina.infrastructure.persistence.FinancialTitleRepository;
import br.com.oficina.infrastructure.persistence.MechanicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommissionService {

	private final CommissionsRepository commissionsRepository;
	private final MechanicRepository mechanicRepository;
	private final FinancialTitleRepository financialTitleRepository;
	private final UserContext userContext;

	@Transactional
	public void calculateAndSaveCommissions(ServiceOrder serviceOrder) {
		if (serviceOrder.getItemOS() == null) return;

		serviceOrder.getItemOS().stream()
		            .filter(item -> TypeItem.SERVICE.equals(item.type()))
		            .filter(item -> item.mechanicId() != null)
		            .forEach(item -> processSingleItemCommission(serviceOrder, item));
	}

	public void processSingleItemCommission(ServiceOrder serviceOrder, ItemOS item) {
		Mechanic mechanic = mechanicRepository.findById(item.mechanicId())
		                                      .orElseThrow(() -> new IllegalArgumentException("Mechanic not found with ID: " + item.mechanicId()));

		if (!mechanic.getEnterpriseId().equals(serviceOrder.getEnterpriseId())) {
			throw new IllegalStateException("Mechanic does not belong to the same enterprise as the Service Order");
		}

		if (!mechanic.isActive()) return;

		BigDecimal commissionValue = item.total()
		                                 .multiply(mechanic.getStandardCommissionPercentage())
		                                 .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_EVEN);

		Commissions commissions = new Commissions();
		commissions.setEnterpriseId(serviceOrder.getEnterpriseId());
		commissions.setMechanicId(mechanic.getId());
		commissions.setMechanicName(mechanic.getName());
		commissions.setOsId(serviceOrder.getId());
		commissions.setServiceName(item.name());
		commissions.setValueBaseService(item.total());
		commissions.setValueCommission(commissionValue);
		commissions.setPercentageApplied(mechanic.getStandardCommissionPercentage());
		commissions.setDateCalculation(LocalDate.now());
		commissions.setStatus(CommissionStatus.PENDING);

		commissionsRepository.save(commissions);
	}


	@Transactional
	public FinancialTitle payCommissions(List<UUID> commissionIds) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();

		List<Commissions> commissions = commissionsRepository.findAllById(commissionIds);

		if (commissions.isEmpty()) {
			throw new IllegalArgumentException("No commission found for the IDs provided..");
		}

		commissions.forEach(c -> {
			if (!c.getEnterpriseId().equals(enterpriseId)) {
				throw new IllegalStateException("The commission does not belong to the user's company.: " + c.getId());
			}
			if (!CommissionStatus.PENDING.equals(c.getStatus())) {
				throw new IllegalStateException("The commission has already been paid or cancelled.: " + c.getId());
			}
		});

		boolean sameMechanic = commissions.stream()
		                                  .map(Commissions::getMechanicId)
		                                  .distinct()
		                                  .count() == 1;

		if (!sameMechanic) {
			throw new IllegalArgumentException("The committees must belong to the same mechanic.");
		}

		String mechanicName = commissions.get(0).getMechanicName();

		BigDecimal totalValue = commissions.stream()
		                                   .map(Commissions::getValueCommission)
		                                   .reduce(BigDecimal.ZERO, BigDecimal::add);

		commissions.forEach(c -> {
			c.setStatus(CommissionStatus.PAID);
			c.setPaymentDate(LocalDate.now());
		});
		commissionsRepository.saveAll(commissions);

		FinancialTitle title = new FinancialTitle();
		title.setEnterpriseId(enterpriseId);
		title.setDescription("Pagamento comissão - " + mechanicName);
		title.setType(FinancialType.EXPENSE);
		title.setCategory("COMISSAO");
		title.setOriginalValue(totalValue);
		title.setPaidValue(totalValue);
		title.setDueDate(LocalDate.now());
		title.setPaymentDate(LocalDate.now());
		title.setPaymentMethod(PaymentMethod.MONEY);
		title.setStatus(FinancialTitleStatus.PAID);

		return financialTitleRepository.save(title);
	}

	public List<Commissions> findByMechanicId(UUID mechanicId) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return commissionsRepository.findByEnterpriseIdAndMechanicId(enterpriseId, mechanicId);
	}

	public List<Commissions> findByOsId(UUID osId) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return commissionsRepository.findByEnterpriseIdAndOsId(enterpriseId, osId);
	}
}