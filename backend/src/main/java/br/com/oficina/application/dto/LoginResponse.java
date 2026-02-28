package br.com.oficina.application.dto;

public record LoginResponse(String name, String token, String refreshToken) {}

