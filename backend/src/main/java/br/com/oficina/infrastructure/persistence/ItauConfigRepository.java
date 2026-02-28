package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.ItauConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ItauConfigRepository extends MongoRepository<ItauConfig, UUID> {
    Optional<ItauConfig> findByEnterpriseId(UUID enterpriseId);
}
