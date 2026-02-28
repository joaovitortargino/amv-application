package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.Client;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ClientRepository extends MongoRepository <Client, UUID> {

	Optional<Client> findByDocumentAndEnterpriseId(String document, UUID enterpriseId);
	
	boolean existsByDocumentAndEnterpriseId(String document, UUID enterpriseId);

	// Busca inteligente: Nome OU Documento OU Email OU Telefone (FILTRADO POR EMPRESA)
	@Query("{" +
			"  'enterpriseId': ?1," +
			"  $or: [" +
			"    { 'name': { $regex: ?0, $options: 'i' } }," +
			"    { 'document': { $regex: ?0, $options: 'i' } }," +
			"    { 'contact.email': { $regex: ?0, $options: 'i' } }," +
			"    { 'contact.cellPhone': { $regex: ?0, $options: 'i' } }" +
			"  ]," +
			"  'active': true" +
			"}")
	Page<Client> search(String term, UUID enterpriseId, Pageable pageable);

	Page<Client> findByEnterpriseIdAndActiveTrue(UUID enterpriseId, Pageable pageable);
	
	Optional<Client> findByIdAndEnterpriseId(UUID id, UUID enterpriseId);
}
