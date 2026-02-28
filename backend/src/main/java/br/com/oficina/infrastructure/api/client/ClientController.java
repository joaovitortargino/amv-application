package br.com.oficina.infrastructure.api.client;

import br.com.oficina.application.dto.ClientRequestDTO;
import br.com.oficina.application.service.ClientService;
import br.com.oficina.domain.entities.Client;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/clients")
@RequiredArgsConstructor
public class ClientController {

	private final ClientService clientService;

	@GetMapping
	public ResponseEntity<Page<Client>> listClients(
		@RequestParam(required = false) String search,
		@PageableDefault(size = 20, sort = "name") Pageable pageable) {
		
		return ResponseEntity.ok(clientService.listAll(search, pageable));
	}

	@PostMapping
	public ResponseEntity<Client> create(@RequestBody ClientRequestDTO dto) {
		return ResponseEntity.ok(clientService.create(dto));
	}

	@GetMapping("/{id}")
	public ResponseEntity<Client> getClientById(@PathVariable UUID id) {
		return ResponseEntity.ok(clientService.findById(id));
	}

	@GetMapping("/document/{document}")
	public ResponseEntity<Client> getClientByDocument(@PathVariable String document) {
		return ResponseEntity.ok(clientService.findByDocument(document));
	}

	@PutMapping("/{id}")
	public ResponseEntity<Client> updateClient(@PathVariable UUID id, @RequestBody ClientRequestDTO dto) {
		return ResponseEntity.ok(clientService.update(id, dto));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		clientService.delete(id);
		return ResponseEntity.noContent().build();
	}
	
	@PatchMapping("/{id}/reactivate")
	public ResponseEntity<Void> reactivate(@PathVariable UUID id) {
		clientService.reactivate(id);
		return ResponseEntity.noContent().build();
	}
}
