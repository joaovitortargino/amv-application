package br.com.oficina.infrastructure.integration.itau.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ItauBoletoRequest(
        @JsonProperty("data") ItauBoletoData data
) {
    public record ItauBoletoData(
            @JsonProperty("etapa_processo_boleto") String etapaProcessoBoleto,
            @JsonProperty("codigo_canal_operacao") String codigoCanalOperacao,
            @JsonProperty("beneficiario") Beneficiario beneficiario,
            @JsonProperty("dado_boleto") DadoBoleto dadoBoleto
    ) {}

    public record Beneficiario(
            @JsonProperty("id_beneficiario") String idBeneficiario
    ) {}

    public record DadoBoleto(
            @JsonProperty("descricao_instrumento_cobranca") String descricaoInstrumentoCobranca,
            @JsonProperty("tipo_boleto") String tipoBoleto,
            @JsonProperty("codigo_carteira") String codigoCarteira,
            @JsonProperty("valor_total_titulo") String valorTotalTitulo,
            @JsonProperty("codigo_especie") String codigoEspecie,
            @JsonProperty("valor_abatimento") String valorAbatimento,
            @JsonProperty("data_emissao") String dataEmissao,
            @JsonProperty("indicador_pagamento_parcial") Boolean indicadorPagamentoParcial,
            @JsonProperty("quantidade_maximo_parcial") Integer quantidadeMaximoParcial,
            @JsonProperty("pagador") Pagador pagador,
            @JsonProperty("dados_individuais_boleto") List<DadosIndividuais> dadosIndividuais,
            @JsonProperty("lista_mensagem_cobranca") List<MensagemCobranca> listaMensagemCobranca
    ) {}

    public record DadosIndividuais(
            @JsonProperty("numero_nosso_numero") String numeroNossoNumero,
            @JsonProperty("data_vencimento") String dataVencimento,
            @JsonProperty("valor_titulo") String valorTitulo,
            @JsonProperty("texto_uso_beneficiario") String textoUsoBeneficiario,
            @JsonProperty("texto_seu_numero") String textoSeuNumero
    ) {}

    public record Pagador(
            @JsonProperty("pessoa") Pessoa pessoa,
            @JsonProperty("endereco") Endereco endereco
    ) {}

    public record Pessoa(
            @JsonProperty("nome_pessoa") String nomePessoa,
            @JsonProperty("tipo_pessoa") TipoPessoa tipoPessoa
    ) {}

    public record TipoPessoa(
            @JsonProperty("codigo_tipo_pessoa") String codigoTipoPessoa,
            @JsonProperty("numero_cadastro_pessoa_fisica") String cpf,
            @JsonProperty("numero_cadastro_nacional_pessoa_juridica") String cnpj
    ) {}

    public record Endereco(
            @JsonProperty("nome_logradouro") String nomeLogradouro,
            @JsonProperty("numero_logradouro") String numeroLogradouro,
            @JsonProperty("nome_bairro") String nomeBairro,
            @JsonProperty("nome_cidade") String nomeCidade,
            @JsonProperty("sigla_UF") String siglaUF,
            @JsonProperty("numero_CEP") String numeroCEP
    ) {}

    public record MensagemCobranca(
            @JsonProperty("mensagem") String mensagem
    ) {}
}
