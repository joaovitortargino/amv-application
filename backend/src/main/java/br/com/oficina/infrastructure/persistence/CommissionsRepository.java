package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.Commissions;
import br.com.oficina.domain.enums.CommissionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CommissionsRepository extends MongoRepository<Commissions, UUID> {

	//relatorio mensal quanto pagar mecânico X no mês?
	List<Commissions> findByEnterpriseIdAndMechanicIdAndDateCalculationBetween(UUID enterpriseId, UUID mechanicId, LocalDate start, LocalDate end);

	//vai ser pra ver comissão pendente na relação ggeral
	List<Commissions> findByEnterpriseIdAndStatus(UUID enterpriseId, CommissionStatus status);
	
	List<Commissions> findByEnterpriseIdAndMechanicId(UUID enterpriseId, UUID mechanicId);
	
	List<Commissions> findByEnterpriseIdAndOsId(UUID enterpriseId, UUID osId);

	List<Commissions> findByEnterpriseIdAndDateCalculationBetween(UUID enterpriseId, LocalDate start, LocalDate end);
}
