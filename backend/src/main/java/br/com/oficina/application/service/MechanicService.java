package br.com.oficina.application.service;

import br.com.oficina.application.dto.MechanicRequestDTO;
import br.com.oficina.application.dto.MechanicResponseDTO;
import br.com.oficina.domain.entities.Mechanic;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.MechanicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MechanicService {

	private final MechanicRepository repository;
	private final UserContext userContext;
	private final AuditService auditService;
	private final SequenceGeneratorService sequenceGeneratorService;

	@Transactional
	public MechanicResponseDTO save(MechanicRequestDTO dto) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		
		if (repository.existsByDocumentAndEnterpriseId(dto.document(), enterpriseId)) {
			throw new IllegalArgumentException("Mechanic is already registered with this document");
		}
		if (dto.standardCommissionPercentage() == null) {
			throw new IllegalArgumentException("Commission percentage is required");
		}
		
		Mechanic mechanic = new Mechanic();
		mechanic.setEnterpriseId(enterpriseId);
		// Gera o código sequencial único por empresa
		mechanic.setMechanicCode(sequenceGeneratorService.generateSequence("mechanic_sequence_" + enterpriseId));

		BeanUtils.copyProperties(dto, mechanic);
		
		Mechanic saved = repository.save(mechanic);
		
		auditService.log("CREATE", "Mechanic", saved.getId().toString(), "Created mechanic " + saved.getName());
		
		return toResponseDTO(saved);
	}

	public MechanicResponseDTO findById(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		Mechanic mechanic = repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new IllegalArgumentException("Mechanic not found"));
		return toResponseDTO(mechanic);
	}

	public List<MechanicResponseDTO> findAllActive() {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return repository.findByEnterpriseIdAndActiveTrue(enterpriseId).stream()
				.map(this::toResponseDTO)
				.collect(Collectors.toList());
	}

	@Transactional
	public MechanicResponseDTO update(UUID id, MechanicRequestDTO dto) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		Mechanic existingMechanic = repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new IllegalArgumentException("Mechanic not found"));
		
		// Se o documento mudou, verificar se já existe outro com esse documento NA MESMA EMPRESA
		if (!existingMechanic.getDocument().equals(dto.document()) && 
			repository.existsByDocumentAndEnterpriseId(dto.document(), enterpriseId)) {
			throw new IllegalArgumentException("Mechanic is already registered with this document");
		}
		
		BeanUtils.copyProperties(dto, existingMechanic);
		Mechanic saved = repository.save(existingMechanic);
		
		auditService.log("UPDATE", "Mechanic", saved.getId().toString(), "Updated mechanic " + saved.getName());
		
		return toResponseDTO(saved);
	}

	@Transactional
	public MechanicResponseDTO changeActive(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		Mechanic existingMechanic = repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new IllegalArgumentException("Mechanic not found"));
		existingMechanic.setActive(!existingMechanic.isActive());

		Mechanic saved = repository.save(existingMechanic);
		
		auditService.log("UPDATE", "Mechanic", saved.getId().toString(), "Changed active status to " + saved.isActive());
		
		return toResponseDTO(saved);
	}
	
	private MechanicResponseDTO toResponseDTO(Mechanic mechanic) {
		return new MechanicResponseDTO(
				mechanic.getId(),
				mechanic.getName(),
				mechanic.getDocument(),
				mechanic.getContact(),
				mechanic.isActive(),
				mechanic.getStandardCommissionPercentage()
		);
	}
}
