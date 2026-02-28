package br.com.oficina.infrastructure.integration.itau.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ItauAuthResponse(
    @JsonProperty("access_token") String accessToken,
    @JsonProperty("token_type") String tokenType,
    @JsonProperty("expires_in") Integer expiresIn
) {}
