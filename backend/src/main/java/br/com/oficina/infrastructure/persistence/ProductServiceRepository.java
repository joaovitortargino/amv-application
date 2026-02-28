package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductServiceRepository extends MongoRepository<ProductService, UUID> {

	//busca produto para add na OS
	List<ProductService> findByEnterpriseIdAndNameContainingIgnoreCaseAndActiveTrue(UUID enterpriseId, String name);

	//filtra só servico ou só produto
	List<ProductService> findByEnterpriseIdAndType(UUID enterpriseId, String type);

	// Busca combinada para facilitar filtros na tela de OS
	List<ProductService> findByEnterpriseIdAndNameContainingIgnoreCaseAndTypeAndActiveTrue(UUID enterpriseId, String name, String type);
	
	// Busca por tipo e ativos
	List<ProductService> findByEnterpriseIdAndTypeAndActiveTrue(UUID enterpriseId, String type);
	
	Page<ProductService> findByEnterpriseId(UUID enterpriseId, Pageable pageable);
	
	Optional<ProductService> findByIdAndEnterpriseId(UUID id, UUID enterpriseId);
	
	boolean existsByIdAndEnterpriseId(UUID id, UUID enterpriseId);
}
