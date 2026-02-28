package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.Mechanic;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MechanicRepository extends MongoRepository<Mechanic, UUID> {

	List<Mechanic> findByEnterpriseIdAndActiveTrue(UUID enterpriseId);

	boolean existsByDocumentAndEnterpriseId(String document, UUID enterpriseId);
	
	Optional<Mechanic> findByIdAndEnterpriseId(UUID id, UUID enterpriseId);

	Optional<Mechanic> findTopByOrderByMechanicCodeDesc();
}
