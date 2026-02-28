package br.com.oficina.infrastructure.integration.itau.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.stream.Collectors;

public record ItauErrorResponse(
    String codigo,
    String mensagem,
    String campo,
    List<ItauErrorDetail> erros
) {
    public record ItauErrorDetail(
        String codigo,
        String mensagem,
        String campo
    ) {}

    /**
     * Formata a mensagem de erro para ser mais legível.
     */
    public String getFormattedMessage() {
        if (erros != null && !erros.isEmpty()) {
            return "Multiplos erros: " + erros.stream()
                .map(e -> String.format("Campo '%s': %s (%s)", e.campo, e.mensagem, e.codigo))
                .collect(Collectors.joining("; "));
        }
        if (codigo != null) {
            return String.format("Campo '%s': %s (%s)", campo, mensagem, codigo);
        }
        return "Erro desconhecido na resposta do Itaú.";
    }
}
