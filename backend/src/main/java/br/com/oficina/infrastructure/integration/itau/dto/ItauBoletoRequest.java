package br.com.oficina.infrastructure.integration.itau.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ItauBoletoRequest(
    @JsonProperty("data") ItauBoletoData data
) {
    public record ItauBoletoData(
        @JsonProperty("codigo_canal_operacao") String codigoCanalOperacao, // "BKL"
        @JsonProperty("etapa_processo_boleto") String etapaProcessoBoleto, // "efetivacao"
        @JsonProperty("dado_boleto") DadoBoleto dadoBoleto
    ) {}

    public record DadoBoleto(
        @JsonProperty("descricao_instrumento_cobranca") String descricaoInstrumentoCobranca, // "boleto"
        @JsonProperty("tipo_boleto") String tipoBoleto, // "a vista"
        @JsonProperty("codigo_carteira") String codigoCarteira, // "109"
        @JsonProperty("valor_total_titulo") String valorTotalTitulo, // "150.00"
        @JsonProperty("dados_individuais_boleto") java.util.List<DadosIndividuais> dadosIndividuais
    ) {}

    public record DadosIndividuais(
        @JsonProperty("numero_nosso_numero") String numeroNossoNumero, // "12345678"
        @JsonProperty("data_vencimento") String dataVencimento, // "2023-10-30"
        @JsonProperty("valor_titulo") String valorTitulo,
        @JsonProperty("pagador") Pagador pagador
    ) {}

    public record Pagador(
        @JsonProperty("pessoa") Pessoa pessoa,
        @JsonProperty("endereco") Endereco endereco
    ) {}

    public record Pessoa(
        @JsonProperty("nome_pessoa") String nomePessoa,
        @JsonProperty("tipo_pessoa") String tipoPessoa, // "F" ou "J"
        @JsonProperty("numero_cadastro_pessoa_fisica") String cpf, // Opcional
        @JsonProperty("numero_cadastro_nacional_pessoa_juridica") String cnpj // Opcional
    ) {}

    public record Endereco(
        @JsonProperty("nome_logradouro") String nomeLogradouro,
        @JsonProperty("nome_bairro") String nomeBairro,
        @JsonProperty("nome_cidade") String nomeCidade,
        @JsonProperty("sigla_UF") String siglaUF,
        @JsonProperty("numero_CEP") String numeroCEP
    ) {}
}
