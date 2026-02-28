package br.com.oficina.infrastructure.api.productServices;

import br.com.oficina.application.dto.ProductServiceRequestDTO;
import br.com.oficina.application.dto.ProductServiceResponseDTO;
import br.com.oficina.application.service.ProductServService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class ProductServicesController {

	private final ProductServService productServService;

	@PostMapping
	public ResponseEntity<ProductServiceResponseDTO> create(@RequestBody ProductServiceRequestDTO dto) {
		ProductServiceResponseDTO savedItem = productServService.save(dto);
		URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
				.path("/{id}")
				.buildAndExpand(savedItem.id())
				.toUri();
		return ResponseEntity.created(uri).body(savedItem);
	}

	@GetMapping
	public ResponseEntity<Page<ProductServiceResponseDTO>> listAll(Pageable pageable) {
		return ResponseEntity.ok(productServService.listAll(pageable));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ProductServiceResponseDTO> findById(@PathVariable UUID id) {
		return ResponseEntity.ok(productServService.findById(id));
	}

	@PutMapping("/{id}")
	public ResponseEntity<ProductServiceResponseDTO> update(@PathVariable UUID id, @RequestBody ProductServiceRequestDTO dto) {
		return ResponseEntity.ok(productServService.update(id, dto));
	}

	@PatchMapping("/{id}/active")
	public ResponseEntity<ProductServiceResponseDTO> changeActive(@PathVariable UUID id) {
		return ResponseEntity.ok(productServService.changeActive(id));
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id) {
		productServService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
