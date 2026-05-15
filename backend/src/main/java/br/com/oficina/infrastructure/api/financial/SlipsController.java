package br.com.oficina.infrastructure.api.financial;

import br.com.oficina.application.service.SlipsService;
import br.com.oficina.application.service.PdfService;
import br.com.oficina.domain.entities.Slips;
import br.com.oficina.domain.enums.SlipStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/slips")
@RequiredArgsConstructor
public class SlipsController {

    private final SlipsService slipsService;
    private final PdfService pdfService;

    @PostMapping("/from-title/{titleId}")
    public ResponseEntity<Slips> createFromTitle(@PathVariable UUID titleId) {
        return ResponseEntity.ok(slipsService.createSlipFromTitle(titleId));
    }

    @GetMapping
    public ResponseEntity<Page<Slips>> search(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam List<SlipStatus> statuses,
            @RequestParam(required = false, defaultValue = "") String payerInfo,
            Pageable pageable
    ) {
        return ResponseEntity.ok(slipsService.searchSlips(startDate, endDate, statuses, payerInfo, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Slips> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(slipsService.findById(id));
    }

    @GetMapping("/{id}/print")
    public ResponseEntity<byte[]> print(@PathVariable UUID id) {
        Slips slip = slipsService.findById(id);
        Map<String, Object> variables = slipsService.buildPrintVariables(id);
        byte[] pdfBytes = pdfService.generatePdf("boleto-print", variables);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "boleto-" + slip.getOurNumber() + ".pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @PostMapping("/{id}/sync-itau")
    public ResponseEntity<Slips> syncItau(@PathVariable UUID id) {
        return ResponseEntity.ok(slipsService.syncItauStatus(id));
    }

    @GetMapping("/{id}/check-status-itau")
    public ResponseEntity<Slips> checkStatusItau(@PathVariable UUID id) {
        return ResponseEntity.ok(slipsService.syncItauStatus(id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Slips> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(slipsService.cancelSlip(id));
    }

    @PatchMapping("/{id}/mark-as-paid")
    public ResponseEntity<Slips> markAsPaid(@PathVariable UUID id, @RequestBody MarkAsPaidDTO dto) {
        return ResponseEntity.ok(slipsService.markAsPaidManually(id, dto.paymentDate(), dto.paidValue()));
    }

    public record MarkAsPaidDTO(LocalDate paymentDate, BigDecimal paidValue) {}
}
