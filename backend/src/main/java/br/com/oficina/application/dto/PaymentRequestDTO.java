package br.com.oficina.application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PaymentRequestDTO(
    @JsonProperty("paidValue")
    BigDecimal paidValue,
    
    @JsonProperty("paymentDate")
    LocalDate paymentDate,
    
    @JsonProperty("isPartialPayment")
    boolean isPartialPayment
) {}
