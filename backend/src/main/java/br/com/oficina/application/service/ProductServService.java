package br.com.oficina.application.service;

import br.com.oficina.application.dto.ProductServiceRequestDTO;
import br.com.oficina.application.dto.ProductServiceResponseDTO;
import br.com.oficina.domain.entities.ProductService;
import br.com.oficina.domain.enums.TypeItem;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.ProductServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServService {

	private final ProductServiceRepository repository;
	private final UserContext userContext;
	private final AuditService auditService;

	@Transactional
	public ProductServiceResponseDTO save(ProductServiceRequestDTO dto) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		ProductService entity = new ProductService();
		entity.setEnterpriseId(enterpriseId);
		
		BeanUtils.copyProperties(dto, entity);
		if (dto.type() != null) {
			entity.setType(dto.type().name());
		}
		// Se for novo, active pode ser true por padrão se não vier no DTO
		if (!dto.active()) {
			entity.setActive(true);
		}
		
		ProductService saved = repository.save(entity);
		
		auditService.log("CREATE", "ProductService", saved.getId().toString(), "Created item " + saved.getName());
		
		return toResponseDTO(saved);
	}

	public Page<ProductServiceResponseDTO> listAll(Pageable pageable) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return repository.findByEnterpriseId(enterpriseId, pageable).map(this::toResponseDTO);
	}

	public ProductServiceResponseDTO findById(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		ProductService entity = repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new IllegalArgumentException("Item not found"));
		return toResponseDTO(entity);
	}

	public ProductServiceResponseDTO findByName(String name) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		var list = repository.findByEnterpriseIdAndNameContainingIgnoreCaseAndActiveTrue(enterpriseId, name);
		if (list.isEmpty()) {
			throw new IllegalArgumentException("Item not found with name: " + name);
		}
		return toResponseDTO(list.get(0));
	}

	@Transactional
	public ProductServiceResponseDTO update(UUID id, ProductServiceRequestDTO dto) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		ProductService existingProduct = repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new IllegalArgumentException("Item not found"));
		
		BeanUtils.copyProperties(dto, existingProduct);
		if (dto.type() != null) {
			existingProduct.setType(dto.type().name());
		}
		
		ProductService saved = repository.save(existingProduct);
		
		auditService.log("UPDATE", "ProductService", saved.getId().toString(), "Updated item " + saved.getName());
		
		return toResponseDTO(saved);
	}

	@Transactional
	public void delete(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		if (!repository.existsByIdAndEnterpriseId(id, enterpriseId)) {
			throw new IllegalArgumentException("Item not found");
		}
		repository.deleteById(id);
		
		auditService.log("DELETE", "ProductService", id.toString(), "Deleted item");
	}

	@Transactional
	public ProductServiceResponseDTO changeActive(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		ProductService existingProduct = repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new IllegalArgumentException("Item not found"));
		existingProduct.setActive(!existingProduct.isActive());
		ProductService saved = repository.save(existingProduct);
		
		auditService.log("UPDATE", "ProductService", saved.getId().toString(), "Changed active status to " + saved.isActive());
		
		return toResponseDTO(saved);
	}

	private ProductServiceResponseDTO toResponseDTO(ProductService entity) {
		TypeItem typeItem = null;
		if (entity.getType() != null) {
			try {
				typeItem = TypeItem.valueOf(entity.getType());
			} catch (IllegalArgumentException e) {
				log.error(e.getMessage());
			}
		}
		return new ProductServiceResponseDTO(
				entity.getId(),
				entity.getName(),
				entity.getDescription(),
				typeItem,
				entity.getPrice(),
				entity.getSalePrice(),
				entity.getPriceCost(),
				entity.isActive()
		);
	}
}
