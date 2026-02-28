package br.com.oficina.application.service;

import br.com.oficina.application.dto.ClientRequestDTO;
import br.com.oficina.domain.entities.Client;
import br.com.oficina.domain.enums.ClientType;
import br.com.oficina.infrastructure.configuration.UserContext;
import br.com.oficina.infrastructure.persistence.ClientRepository;
import br.com.oficina.shared.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClientService {
	private final ClientRepository repository;
	private final UserContext userContext;
	private final AuditService auditService;

	@Transactional
	public Client create(ClientRequestDTO dto) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		String sanitizedDoc = sanitize(dto.document());
		validateDocument(sanitizedDoc, dto.type());

		if (repository.existsByDocumentAndEnterpriseId(sanitizedDoc, enterpriseId)) {
			throw new BusinessException("Client already registered with this document: " + dto.document());
		}

		Client client = new Client();
		client.setEnterpriseId(enterpriseId);
		updateClientData(client, dto);
		client.setDocument(sanitizedDoc);

		Client saved = repository.save(client);
		
		auditService.log("CREATE", "Client", saved.getId().toString(), "Created client " + saved.getName());
		
		return saved;
	}

	@Transactional
	public Client update(UUID id, ClientRequestDTO dto) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		Client existingClient = findById(id); // Já valida enterpriseId dentro do findById
		
		// Se tentar mudar o documento, verifica se já não existe outro NA MESMA EMPRESA
		if (dto.document() != null) {
			String newDoc = sanitize(dto.document());
			if (!newDoc.equals(existingClient.getDocument())) {
				validateDocument(newDoc, dto.type());
				repository.findByDocumentAndEnterpriseId(newDoc, enterpriseId).ifPresent(c -> {
					if (!c.getId().equals(id)) {
						throw new BusinessException("Another client already has this document");
					}
				});
				existingClient.setDocument(newDoc);
			}
		}

		updateClientData(existingClient, dto);
		existingClient.setLastUpdate(LocalDateTime.now());

		Client saved = repository.save(existingClient);
		
		auditService.log("UPDATE", "Client", saved.getId().toString(), "Updated client " + saved.getName());
		
		return saved;
	}

	public Page<Client> listAll(String searchTerm, Pageable pageable) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		if (searchTerm != null && !searchTerm.isBlank()) {
			return repository.search(searchTerm, enterpriseId, pageable);
		}
		return repository.findByEnterpriseIdAndActiveTrue(enterpriseId, pageable);
	}

	public Client findById(UUID id) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return repository.findByIdAndEnterpriseId(id, enterpriseId)
				.orElseThrow(() -> new BusinessException("Client not found"));
	}

	public Client findByDocument(String document) {
		UUID enterpriseId = userContext.getCurrentEnterpriseId();
		return repository.findByDocumentAndEnterpriseId(sanitize(document), enterpriseId)
				.orElseThrow(() -> new BusinessException("Client not found"));
	}

	@Transactional
	public void delete(UUID id) {
		Client client = findById(id);
		client.setActive(false); // Soft delete
		client.setLastUpdate(LocalDateTime.now());
		repository.save(client);
		
		auditService.log("DELETE", "Client", client.getId().toString(), "Soft deleted client " + client.getName());
	}
	
	@Transactional
	public void reactivate(UUID id) {
		Client client = findById(id);
		client.setActive(true);
		repository.save(client);
		
		auditService.log("UPDATE", "Client", client.getId().toString(), "Reactivated client " + client.getName());
	}

	private void updateClientData(Client target, ClientRequestDTO source) {
		if (source.name() != null) target.setName(source.name());
		if (source.type() != null) target.setType(source.type());
		if (source.address() != null) target.setAddress(source.address());
		if (source.contact() != null) target.setContact(source.contact());
		if (source.notes() != null) target.setNotes(source.notes());
	}

	private String sanitize(String value) {
		return value == null ? null : value.replaceAll("\\D", "");
	}

	private void validateDocument(String document, ClientType type) {
		if (document == null || document.isBlank()) {
			throw new BusinessException("Document is required");
		}
		
		if (type == ClientType.PF && document.length() != 11) {
			throw new BusinessException("CPF must have 11 digits");
		}
		
		if (type == ClientType.PJ && document.length() != 14) {
			throw new BusinessException("CNPJ must have 14 digits");
		}
	}
}
