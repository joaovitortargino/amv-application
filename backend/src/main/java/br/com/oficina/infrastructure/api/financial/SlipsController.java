package br.com.oficina.infrastructure.api.financial;

import br.com.oficina.application.service.SlipsService;
import br.com.oficina.domain.entities.Slips;
import br.com.oficina.domain.enums.SlipStatus;
import br.com.oficina.infrastructure.integration.itau.ItauService;
import br.com.oficina.infrastructure.integration.itau.dto.ItauBoletoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/slips")
@RequiredArgsConstructor
public class SlipsController {

    private final SlipsService slipsService;
    private final ItauService itauService;

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

    @GetMapping("/{id}/check-status-itau")
    public ResponseEntity<ItauBoletoResponse> checkStatusItau(@PathVariable UUID id) {
        Slips slip = slipsService.findById(id);
        if (slip.getIdBoletoIndividual() == null) {
            throw new IllegalArgumentException("This slip was not issued through Itaú API.");
        }
        ItauBoletoResponse itauResponse = itauService.consultarBoletoItau(slip.getIdBoletoIndividual());
        return ResponseEntity.ok(itauResponse);
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
