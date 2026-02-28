package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.Enterprise;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.UUID;

public interface EnterpriseRepository extends MongoRepository<Enterprise, UUID> {

	// Busca a primeira empresa cadastrada (para configurações globais)
	Enterprise findFirstByOrderByIdAsc();

	boolean existsByCnpj(String cnpj);
}
