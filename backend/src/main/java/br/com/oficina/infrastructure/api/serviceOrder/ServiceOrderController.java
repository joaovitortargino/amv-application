package br.com.oficina.infrastructure.api.serviceOrder;

import br.com.oficina.application.dto.ItemOSRequestDTO;
import br.com.oficina.application.dto.ServiceOrderReportDTO;
import br.com.oficina.application.dto.ServiceOrderRequestDTO;
import br.com.oficina.application.dto.ServiceOrderResponseDTO;
import br.com.oficina.application.service.ClientService;
import br.com.oficina.application.service.PdfService;
import br.com.oficina.application.service.ServiceOrderService;
import br.com.oficina.domain.entities.Client;
import br.com.oficina.shared.utils.ImageUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/service-orders")
@RequiredArgsConstructor
public class ServiceOrderController {

	private final ServiceOrderService serviceOrderService;
	private final PdfService pdfService;
	private final ClientService clientService;
	private final ImageUtils imageUtils;

	@PostMapping
	public ResponseEntity<ServiceOrderResponseDTO> create(@RequestBody ServiceOrderRequestDTO dto) {
		ServiceOrderResponseDTO savedOS = serviceOrderService.create(dto);
		URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
				.path("/{id}")
				.buildAndExpand(savedOS.id())
				.toUri();
		return ResponseEntity.created(uri).body(savedOS);
	}

	@GetMapping
	public ResponseEntity<List<ServiceOrderResponseDTO>> listAll(
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
	) {
		return ResponseEntity.ok(serviceOrderService.listAll(startDate, endDate));
	}

	@GetMapping("/{id}")
	public ResponseEntity<ServiceOrderResponseDTO> findById(@PathVariable UUID id) {
		return ResponseEntity.ok(serviceOrderService.findById(id));
	}

	@PostMapping("/{id}/items")
	public ResponseEntity<ServiceOrderResponseDTO> addItem(@PathVariable UUID id, @RequestBody ItemOSRequestDTO itemDto) {
		return ResponseEntity.ok(serviceOrderService.addItem(id, itemDto));
	}

	@DeleteMapping("/{id}/items/{itemIndex}")
	public ResponseEntity<ServiceOrderResponseDTO> removeItem(@PathVariable UUID id, @PathVariable int itemIndex) {
		return ResponseEntity.ok(serviceOrderService.removeItem(id, itemIndex));
	}

	@GetMapping("/client/{clientId}")
	public ResponseEntity<List<ServiceOrderResponseDTO>> listByClient(@PathVariable UUID clientId) {
		return ResponseEntity.ok(serviceOrderService.listByClient(clientId));
	}

	@PatchMapping("/{id}/finish")
	public ResponseEntity<ServiceOrderResponseDTO> finish(@PathVariable UUID id) {
		return ResponseEntity.ok(serviceOrderService.finish(id));
	}

	@PatchMapping("/{id}/cancel")
	public ResponseEntity<ServiceOrderResponseDTO> cancel(@PathVariable UUID id) {
		return ResponseEntity.ok(serviceOrderService.cancel(id));
	}
	
	@GetMapping("/{id}/print")
	public ResponseEntity<byte[]> print(@PathVariable UUID id) {
		ServiceOrderResponseDTO os = serviceOrderService.findById(id);
		Client client = clientService.findById(UUID.fromString(os.clientId()));
		
		Map<String, Object> variables = new HashMap<>();
		variables.put("os", os);
		variables.put("client", client);
		variables.put("logo", imageUtils.loadImageAsBase64("static/images/LOGO.jpeg"));
		
		byte[] pdfBytes = pdfService.generatePdf("os-print", variables);
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_PDF);
		headers.setContentDispositionFormData("inline", "os-" + os.osNumber() + ".pdf");
		
		return ResponseEntity.ok()
				.headers(headers)
				.body(pdfBytes);
	}
	
	@GetMapping("/report")
	public ResponseEntity<byte[]> generateReport(
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
	) {
		ServiceOrderReportDTO reportData = serviceOrderService.generateReportData(startDate, endDate);
		
		Map<String, Object> variables = new HashMap<>();
		variables.put("report", reportData);
		variables.put("logo", imageUtils.loadImageAsBase64("static/images/LOGO.jpeg"));
		
		byte[] pdfBytes = pdfService.generatePdf("os-report", variables);
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_PDF);
		headers.setContentDispositionFormData("inline", "relatorio-os.pdf");
		
		return ResponseEntity.ok()
				.headers(headers)
				.body(pdfBytes);
	}
}
