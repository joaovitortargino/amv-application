package br.com.oficina.infrastructure.integration.itau.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ItauBoletoResponse(
        @JsonProperty("data") Data data
) {
    public record Data(
            @JsonProperty("codigoBarras") String codigoBarras,
            @JsonProperty("linhaDigitavel") String linhaDigitavel,
            @JsonProperty("nossoNumero") String nossoNumero,
            @JsonProperty("idBoleto") String idBoleto,
            @JsonProperty("valor") String valor
    ) {}
}