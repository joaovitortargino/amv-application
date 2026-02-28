package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.FinancialType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FinancialTitleRepository extends MongoRepository<FinancialTitle, UUID> {

	Page<FinancialTitle> findByEnterpriseIdAndType(UUID enterpriseId, FinancialType type, Pageable pageable);
	Page<FinancialTitle> findByEnterpriseIdAndStatus(UUID enterpriseId, FinancialTitleStatus status, Pageable pageable);
	Page<FinancialTitle> findByEnterpriseIdAndDueDateBetween(UUID enterpriseId, LocalDate start, LocalDate end, Pageable pageable);
	List<FinancialTitle> findByEnterpriseIdAndTypeAndDueDateBetween(UUID enterpriseId, FinancialType type, LocalDate start, LocalDate end);
	List<FinancialTitle> findByEnterpriseIdAndStatusAndDueDateBefore(UUID enterpriseId, FinancialTitleStatus status, LocalDate today);
	Page<FinancialTitle> findByEnterpriseId(UUID enterpriseId, Pageable pageable);
	Optional<FinancialTitle> findByIdAndEnterpriseId(UUID id, UUID enterpriseId);

	Page<FinancialTitle> findByEnterpriseIdAndTypeAndStatus(UUID enterpriseId, FinancialType type, FinancialTitleStatus status, Pageable pageable);
	Page<FinancialTitle> findByEnterpriseIdAndTypeAndDueDateBetween(UUID enterpriseId, FinancialType type, LocalDate start, LocalDate end, Pageable pageable);
	Page<FinancialTitle> findByEnterpriseIdAndStatusAndDueDateBetween(UUID enterpriseId, FinancialTitleStatus status, LocalDate start, LocalDate end, Pageable pageable);
	Page<FinancialTitle> findByEnterpriseIdAndTypeAndStatusAndDueDateBetween(UUID enterpriseId, FinancialType type, FinancialTitleStatus status, LocalDate start, LocalDate end, Pageable pageable);
	Page<FinancialTitle> findByEnterpriseIdAndCompetenceDateBetween(UUID enterpriseId, LocalDate start, LocalDate end, Pageable pageable);

	@Query("{ 'enterpriseId': ?0, 'dueDate': { $gte: ?1, $lte: ?2 } }")
	Page<FinancialTitle> findByEnterpriseIdAndDueDateBetweenInclusive(
			UUID enterpriseId,
			LocalDate start,
			LocalDate end,
			Pageable pageable
	);

	@Query("{ 'enterpriseId': ?1, 'description': { $regex: ?0, $options: 'i' } }")
	Page<FinancialTitle> searchByDescription(String description, UUID enterpriseId, Pageable pageable);

	List<FinancialTitle> findByEnterpriseIdAndCompetenceDateBetween(UUID enterpriseId, LocalDate start, LocalDate end);
}
