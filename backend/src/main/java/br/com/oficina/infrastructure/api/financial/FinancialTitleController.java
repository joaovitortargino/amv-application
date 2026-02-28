package br.com.oficina.infrastructure.api.financial;

import br.com.oficina.application.dto.CreateTitleDTO;
import br.com.oficina.application.dto.FinancialReportDTO;
import br.com.oficina.application.dto.FinancialTitleFilterDTO;
import br.com.oficina.application.service.FinancialTitleService;
import br.com.oficina.application.service.PdfService;
import br.com.oficina.application.service.SlipsService;
import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.enums.FinancialTitleStatus;
import br.com.oficina.domain.enums.FinancialType;
import br.com.oficina.domain.enums.PaymentMethod;
import br.com.oficina.shared.utils.ImageUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/financial-titles")
@RequiredArgsConstructor
public class FinancialTitleController {

    private final FinancialTitleService financialTitleService;
	private final SlipsService slipsService;
	private final PdfService pdfService;
	private final ImageUtils imageUtils;

    @PostMapping("/from-os")
    public ResponseEntity<FinancialTitle> createFromServiceOrders(@RequestBody CreateTitleFromOSDTO dto) {
        FinancialTitle title = financialTitleService.createTitleFromServiceOrders(dto.osIds());
        URI uri = ServletUriComponentsBuilder.fromCurrentRequestUri().path("/{id}").buildAndExpand(title.getId()).toUri();
        return ResponseEntity.created(uri).body(title);
    }

	@PostMapping("/manual")
	@Transactional
	public ResponseEntity<FinancialTitle> createManualSlip(@RequestBody CreateTitleDTO dto) {
		FinancialTitle newTitle = new FinancialTitle();
		newTitle.setClientId(dto.clientId());
		newTitle.setOriginalValue(dto.originalValue());
		newTitle.setDueDate(dto.dueDate());
		newTitle.setDescription(dto.description());
		newTitle.setType(FinancialType.INCOME);
		newTitle.setCategory(dto.category());
		newTitle.setPaymentMethod(PaymentMethod.BANK_SLIP);
		
		if (dto.osId() != null && !dto.osId().isEmpty()) {
			newTitle.setOsId(String.join(", ", dto.osId()));
		}

		FinancialTitle savedTitle = financialTitleService.createManualTitle(newTitle);

		return ResponseEntity.ok(savedTitle);
	}

	@GetMapping
	public ResponseEntity<Page<FinancialTitle>> listTitles(
			@RequestParam(required = false) FinancialType type,
			@RequestParam(required = false) FinancialTitleStatus status,
			@RequestParam(required = false) String description,
			@RequestParam(required = false) LocalDate dueDateStart,
			@RequestParam(required = false) LocalDate dueDateEnd,
			@RequestParam(required = false) LocalDate competenceDateStart,
			@RequestParam(required = false) LocalDate competenceDateEnd,
			@PageableDefault(size = 20, sort = "dueDate") Pageable pageable) {

		FinancialTitleFilterDTO filter = new FinancialTitleFilterDTO(
				type, status, description,
				dueDateStart, dueDateEnd,
				competenceDateStart, competenceDateEnd);

		return ResponseEntity.ok(financialTitleService.listAll(filter, pageable));
	}

    @GetMapping("/open-payables")
	public ResponseEntity<List<FinancialTitle>> listOpenPayables() {
		return ResponseEntity.ok(financialTitleService.findAllOpenPayables());
	}

    @GetMapping("/{id}")
    public ResponseEntity<FinancialTitle> getTitle(@PathVariable UUID id) {
        return ResponseEntity.ok(financialTitleService.findById(id));
    }

    @PutMapping("/{id}")
	public ResponseEntity<FinancialTitle> updateTitle(@PathVariable UUID id, @RequestBody FinancialTitle title) {
		return ResponseEntity.ok(financialTitleService.updateTitle(id, title));
	}

	@PatchMapping("/{id}/pay")
	public ResponseEntity<FinancialTitle> markAsPaid(
			@PathVariable UUID id,
			@RequestBody(required = false) PaymentRequestDTO paymentData) {

		if (paymentData == null) {
			return ResponseEntity.ok(financialTitleService.markAsPaid(id, null, null, false));
		}
		return ResponseEntity.ok(financialTitleService.markAsPaid(
				id,
				paymentData.paidValue(),
				paymentData.paymentDate(),
				paymentData.isPartialPayment()
		));
	}

    @PostMapping("/{id}/reverse")
	public ResponseEntity<FinancialTitle> reversePayment(@PathVariable UUID id) {
		return ResponseEntity.ok(financialTitleService.reversePayment(id));
	}
	
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> cancelTitle(@PathVariable UUID id) {
		financialTitleService.cancelTitle(id);
		return ResponseEntity.noContent().build();
	}
	
	@GetMapping("/report")
	public ResponseEntity<byte[]> generateReport(
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
	) {
		FinancialReportDTO reportData = financialTitleService.generateReportData(startDate, endDate);
		
		Map<String, Object> variables = new HashMap<>();
		variables.put("report", reportData);
		variables.put("logo", imageUtils.loadImageAsBase64("static/images/LOGO.jpeg"));
		
		byte[] pdfBytes = pdfService.generatePdf("financial-report", variables);
		
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_PDF);
		headers.setContentDispositionFormData("inline", "relatorio-financeiro.pdf");
		
		return ResponseEntity.ok()
				.headers(headers)
				.body(pdfBytes);
	}

    public record CreateTitleFromOSDTO(List<UUID> osIds) {}
    public record PaymentRequestDTO(BigDecimal paidValue, LocalDate paymentDate, boolean isPartialPayment) {}
}
