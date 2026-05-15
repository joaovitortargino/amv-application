package br.com.oficina.infrastructure.integration.itau;

import br.com.oficina.application.service.ItauConfigService;
import br.com.oficina.domain.entities.Client;
import br.com.oficina.domain.entities.FinancialTitle;
import br.com.oficina.domain.entities.ItauConfig;
import br.com.oficina.domain.entities.Slips;
import br.com.oficina.domain.enums.ClientType;
import br.com.oficina.domain.enums.SlipStatus;
import br.com.oficina.domain.vo.Address;
import br.com.oficina.infrastructure.integration.itau.dto.ItauBoletoRequest;
import br.com.oficina.infrastructure.integration.itau.dto.ItauErrorResponse;
import br.com.oficina.shared.exceptions.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.client5.http.io.HttpClientConnectionManager;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactory;
import org.apache.hc.client5.http.ssl.SSLConnectionSocketFactoryBuilder;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.net.ssl.SSLContext;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.KeyStore;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ItauService {

    private static final String SANDBOX_ENVIRONMENT = "SANDBOX";
    private static final String PRODUCTION_ENVIRONMENT = "PRODUCTION";
    private static final String PRODUCTION_AUTH_URL = "https://sts.itau.com.br/api/oauth/token";
    private static final String PRODUCTION_API_URL = "https://api.itau.com.br/cash_management/v2/boletos";
    private static final String PRODUCTION_QUERY_URL = "https://api.itau.com.br/cash_management/v2/boletos";

    private final ItauConfigService configService;

    @Value("${itau.url-auth:https://devportal.itau.com.br/api/jwt}")
    private String defaultAuthUrl;

    @Value("${itau.url-api:https://devportal.itau.com.br/sandboxapi/cash_management_ext_v2/v2/boletos}")
    private String defaultApiUrl;

    @Value("${itau.url-query:https://devportal.itau.com.br/sandboxapi/cash_management_ext_v2/v2/boletos}")
    private String defaultQueryUrl;

    @Value("${itau.scope:}")
    private String defaultScope;

    @Value("${itau.sandbox-token:}")
    private String defaultSandboxToken;

    @Value("${itau.mock-mode:false}")
    private boolean globalMockMode;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public Slips emitirBoleto(Slips slip, Client client) {
        return emitirBoleto(slip, client, null);
    }

    public Slips emitirBoleto(Slips slip, Client client, FinancialTitle title) {
        ItauConfig config = configService.getConfigByEnterpriseId(slip.getEnterpriseId());

        if (config == null || !config.isActive()) {
            if (globalMockMode) {
                return emitirBoletoMock(slip);
            }
            throw new BusinessException("Integracao Itau nao configurada ou inativa para esta empresa.");
        }

        validateConfig(config);
        RestTemplate restTemplate = createRestTemplate(config);
        String token = authenticate(restTemplate, config);
        ItauBoletoRequest request = buildRequest(config, slip, client, title);

        HttpEntity<ItauBoletoRequest> entity = new HttpEntity<>(request, buildHeaders(config, token));

        try {
            String apiUrl = resolveApiUrl(config);
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(apiUrl, entity, JsonNode.class);
            updateSlipFromItauResponse(slip, response.getBody());
            slip.setStatus(SlipStatus.REGISTERED);
            return slip;
        } catch (RestClientResponseException e) {
            handleItauError(e, "emissao de boleto");
        } catch (Exception e) {
            log.error("Erro desconhecido ao emitir boleto Itau", e);
            throw new BusinessException("Erro na integracao com Itau: " + e.getMessage());
        }

        return null;
    }

    public JsonNode consultarBoletoItau(Slips slip) {
        ItauConfig config = configService.getConfigByEnterpriseId(slip.getEnterpriseId());

        if (config == null || !config.isActive()) {
            if (globalMockMode) {
                log.warn("MOCK MODE: consulta de boleto nao disponivel.");
                return objectMapper.createObjectNode()
                        .put("mock", true)
                        .put("id_boleto_individual", slip.getIdBoletoIndividual());
            }
            throw new BusinessException("Configuracao Itau nao encontrada.");
        }

        validateConfig(config);
        RestTemplate restTemplate = createRestTemplate(config);
        String token = authenticate(restTemplate, config);
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders(config, token));

        String url = UriComponentsBuilder.fromHttpUrl(resolveQueryUrl(config))
                .queryParam("id_beneficiario", config.getBeneficiaryId())
                .queryParam("codigo_carteira", config.getWalletCode())
                .queryParam("nosso_numero", slip.getOurNumber())
                .queryParam("view", "specific")
                .toUriString();

        try {
            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);
            return response.getBody();
        } catch (RestClientResponseException e) {
            handleItauError(e, "consulta de boleto");
        } catch (Exception e) {
            log.error("Erro ao consultar boleto no Itau", e);
            throw new BusinessException("Erro na integracao com Itau: " + e.getMessage());
        }

        return null;
    }

    private HttpHeaders buildHeaders(ItauConfig config, String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        headers.setBearerAuth(token);
        addSandboxTokenHeader(headers, config);
        headers.set("x-itau-apikey", config.getClientId());
        headers.set("x-itau-correlationID", UUID.randomUUID().toString());
        headers.set("x-itau-flowID", UUID.randomUUID().toString());
        return headers;
    }

    private RestTemplate createRestTemplate(ItauConfig config) {
        if (config.getCertificateData() == null || config.getCertificateData().length == 0) {
            if (isProduction(config)) {
                throw new BusinessException("Certificado digital e obrigatorio para producao.");
            }
            return new RestTemplate();
        }
        if (isBlank(config.getCertificatePassword())) {
            throw new BusinessException("Senha do certificado digital nao configurada.");
        }

        try {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            keyStore.load(new ByteArrayInputStream(config.getCertificateData()), config.getCertificatePassword().toCharArray());

            SSLContext sslContext = SSLContextBuilder.create()
                    .loadKeyMaterial(keyStore, config.getCertificatePassword().toCharArray())
                    .build();

            SSLConnectionSocketFactory socketFactory = SSLConnectionSocketFactoryBuilder.create()
                    .setSslContext(sslContext)
                    .build();

            HttpClientConnectionManager connectionManager = PoolingHttpClientConnectionManagerBuilder.create()
                    .setSSLSocketFactory(socketFactory)
                    .build();

            CloseableHttpClient httpClient = HttpClients.custom()
                    .setConnectionManager(connectionManager)
                    .build();

            return new RestTemplate(new HttpComponentsClientHttpRequestFactory(httpClient));
        } catch (Exception e) {
            log.error("Falha ao criar contexto SSL para empresa {}", config.getEnterpriseId(), e);
            throw new BusinessException("Falha ao carregar certificado digital: " + e.getMessage());
        }
    }

    private String authenticate(RestTemplate restTemplate, ItauConfig config) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        addSandboxTokenHeader(headers, config);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "client_credentials");
        map.add("client_id", config.getClientId());
        map.add("client_secret", config.getClientSecret());

        String scope = defaultIfBlank(config.getScope(), defaultScope);
        if (!isBlank(scope)) {
            map.add("scope", scope);
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(resolveAuthUrl(config), request, JsonNode.class);
            String token = findFirstText(response.getBody(), "access_token", "accessToken", "token");
            if (isBlank(token)) {
                throw new BusinessException("Resposta de autenticacao Itau nao trouxe access_token.");
            }
            return token;
        } catch (RestClientResponseException e) {
            handleItauError(e, "autenticacao");
        }

        throw new BusinessException("Falha ao autenticar no Itau.");
    }

    private ItauBoletoRequest buildRequest(ItauConfig config, Slips slip, Client client, FinancialTitle title) {
        validateConfig(config);
        validateClient(client);

        String formattedValue = formatMoney(slip.getValue());
        String dueDate = slip.getDueDate().format(DateTimeFormatter.ISO_DATE);
        String issueDate = LocalDate.now().format(DateTimeFormatter.ISO_DATE);
        String document = onlyDigits(client.getDocument());
        boolean isPessoaJuridica = client.getType() == ClientType.PJ;

        ItauBoletoRequest.TipoPessoa tipoPessoa = new ItauBoletoRequest.TipoPessoa(
                isPessoaJuridica ? "J" : "F",
                isPessoaJuridica ? null : document,
                isPessoaJuridica ? document : null
        );

        ItauBoletoRequest.Pessoa pessoa = new ItauBoletoRequest.Pessoa(
                truncate(client.getName(), 50),
                tipoPessoa
        );

        Address clientAddress = client.getAddress();
        ItauBoletoRequest.Endereco endereco = new ItauBoletoRequest.Endereco(
                truncate(clientAddress.publicPlace(), 45),
                truncate(clientAddress.number(), 10),
                truncate(clientAddress.district(), 15),
                truncate(clientAddress.city(), 20),
                truncate(clientAddress.state(), 2),
                onlyDigits(clientAddress.cep())
        );

        ItauBoletoRequest.Pagador pagador = new ItauBoletoRequest.Pagador(pessoa, endereco);

        String osReference = title != null && !isBlank(title.getOsId())
                ? "OS " + title.getOsId()
                : "Titulo " + slip.getSourceId();

        ItauBoletoRequest.DadosIndividuais dadosIndividuais = new ItauBoletoRequest.DadosIndividuais(
                slip.getOurNumber(),
                dueDate,
                formattedValue,
                truncate(osReference, 25),
                truncate(String.valueOf(slip.getSourceId()), 25)
        );

        ItauBoletoRequest.DadoBoleto dadoBoleto = new ItauBoletoRequest.DadoBoleto(
                "boleto",
                "a vista",
                config.getWalletCode(),
                formattedValue,
                "01",
                formatMoney(BigDecimal.ZERO),
                issueDate,
                false,
                0,
                pagador,
                List.of(dadosIndividuais),
                List.of(new ItauBoletoRequest.MensagemCobranca(truncate("Referente a " + osReference, 80)))
        );

        return new ItauBoletoRequest(
                new ItauBoletoRequest.ItauBoletoData(
                        defaultIfBlank(config.getBoletoProcessStage(), "efetivacao"),
                        "API",
                        new ItauBoletoRequest.Beneficiario(config.getBeneficiaryId()),
                        dadoBoleto
                )
        );
    }

    private void updateSlipFromItauResponse(Slips slip, JsonNode body) {
        if (body == null || body.isNull()) {
            throw new BusinessException("Resposta inesperada do Itau: corpo vazio.");
        }

        String idBoleto = findFirstText(body, "id_boleto_individual", "id_boleto", "idBoletoIndividual", "idBoleto");
        String codigoBarras = findFirstText(body, "codigo_barras", "codigoBarras");
        String linhaDigitavel = findFirstText(body, "numero_linha_digitavel", "linha_digitavel", "linhaDigitavel");
        String nossoNumero = findFirstText(body, "numero_nosso_numero", "nosso_numero", "nossoNumero");

        if (!isBlank(idBoleto)) {
            slip.setIdBoletoIndividual(idBoleto);
        }
        if (!isBlank(codigoBarras)) {
            slip.setBarCode(codigoBarras);
        }
        if (!isBlank(linhaDigitavel)) {
            slip.setDigitableLine(linhaDigitavel);
        }
        if (!isBlank(nossoNumero)) {
            slip.setOurNumber(nossoNumero);
        }

        if (isBlank(slip.getIdBoletoIndividual())) {
            throw new BusinessException("Resposta do Itau nao trouxe identificador do boleto: " + jsonPreview(body));
        }
    }

    private void handleItauError(RestClientResponseException e) {
        handleItauError(e, "chamada");
    }

    private void handleItauError(RestClientResponseException e, String operation) {
        String errorBody = e.getResponseBodyAsString();
        log.error("Erro na chamada para o Itau durante {}. Status: {}, Body: {}", operation, e.getStatusCode(), errorBody);
        String formattedMessage = null;
        try {
            ItauErrorResponse errorResponse = objectMapper.readValue(errorBody, ItauErrorResponse.class);
            formattedMessage = errorResponse.getFormattedMessage();
        } catch (Exception parseException) {
            // Falls through to the raw response below.
        }
        if (!isBlank(formattedMessage)) {
            throw new BusinessException("Erro Itau: " + formattedMessage);
        }
        if (e.getStatusCode().value() == 401 && isBlank(errorBody)) {
            throw new BusinessException("Erro Itau durante " + operation + " (401 UNAUTHORIZED). Verifique clientId, clientSecret, x-sandbox-token e se a API Cash Management Ext V2 esta liberada para a aplicacao no DevPortal.");
        }
        throw new BusinessException("Erro Itau durante " + operation + " (" + e.getStatusCode() + "): " + errorBody);
    }

    private void validateConfig(ItauConfig config) {
        if (isBlank(config.getBeneficiaryId())) {
            throw new BusinessException("Configure o ID do beneficiario do Itau antes de emitir boletos.");
        }
        if (isBlank(config.getWalletCode())) {
            throw new BusinessException("Configure a carteira de boleto do Itau antes de emitir boletos.");
        }
        if (isSandbox(config) && isBlank(resolveSandboxToken(config))) {
            throw new BusinessException("Configure o Sandbox Token do Itau antes de emitir boletos no sandbox.");
        }
    }

    private void validateClient(Client client) {
        if (client == null) {
            throw new BusinessException("Cliente do titulo nao encontrado.");
        }
        if (isBlank(client.getName()) || isBlank(client.getDocument()) || client.getType() == null) {
            throw new BusinessException("Cliente precisa ter nome, CPF/CNPJ e tipo PF/PJ para emitir boleto.");
        }
        Address address = client.getAddress();
        if (address == null
                || isBlank(address.publicPlace())
                || isBlank(address.district())
                || isBlank(address.city())
                || isBlank(address.state())
                || isBlank(address.cep())) {
            throw new BusinessException("Cliente precisa ter endereco completo para emitir boleto.");
        }
    }

    private String resolveAuthUrl(ItauConfig config) {
        if (!isBlank(config.getAuthUrl())) {
            return config.getAuthUrl().trim();
        }
        return isProduction(config) ? PRODUCTION_AUTH_URL : defaultAuthUrl;
    }

    private String resolveApiUrl(ItauConfig config) {
        if (!isBlank(config.getApiUrl())) {
            return config.getApiUrl().trim();
        }
        return isProduction(config) ? PRODUCTION_API_URL : defaultApiUrl;
    }

    private String resolveQueryUrl(ItauConfig config) {
        if (!isBlank(config.getQueryUrl())) {
            return config.getQueryUrl().trim();
        }
        return isProduction(config) ? PRODUCTION_QUERY_URL : defaultQueryUrl;
    }

    private boolean isProduction(ItauConfig config) {
        return PRODUCTION_ENVIRONMENT.equalsIgnoreCase(defaultIfBlank(config.getEnvironment(), SANDBOX_ENVIRONMENT));
    }

    private boolean isSandbox(ItauConfig config) {
        return SANDBOX_ENVIRONMENT.equalsIgnoreCase(defaultIfBlank(config.getEnvironment(), SANDBOX_ENVIRONMENT));
    }

    private void addSandboxTokenHeader(HttpHeaders headers, ItauConfig config) {
        if (!isSandbox(config)) {
            return;
        }

        String sandboxToken = resolveSandboxToken(config);
        if (!isBlank(sandboxToken)) {
            headers.set("x-sandbox-token", sandboxToken);
        }
    }

    private String resolveSandboxToken(ItauConfig config) {
        return defaultIfBlank(config.getSandboxToken(), defaultSandboxToken);
    }

    private String formatMoney(BigDecimal value) {
        BigDecimal cents = value.setScale(2, RoundingMode.HALF_UP).movePointRight(2);
        return String.format("%017d", cents.longValueExact());
    }

    private String onlyDigits(String value) {
        return value == null ? null : value.replaceAll("\\D", "");
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return isBlank(value) ? defaultValue : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String findFirstText(JsonNode node, String... fieldNames) {
        if (node == null || node.isNull()) {
            return null;
        }

        if (node.isObject()) {
            for (String fieldName : fieldNames) {
                JsonNode value = node.get(fieldName);
                if (value != null && !value.isNull() && value.isValueNode()) {
                    return value.asText();
                }
            }

            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                for (String fieldName : fieldNames) {
                    if (entry.getKey().equalsIgnoreCase(fieldName)
                            && entry.getValue() != null
                            && !entry.getValue().isNull()
                            && entry.getValue().isValueNode()) {
                        return entry.getValue().asText();
                    }
                }
                String found = findFirstText(entry.getValue(), fieldNames);
                if (!isBlank(found)) {
                    return found;
                }
            }
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                String found = findFirstText(child, fieldNames);
                if (!isBlank(found)) {
                    return found;
                }
            }
        }

        return null;
    }

    private String jsonPreview(JsonNode body) {
        try {
            String serialized = objectMapper.writeValueAsString(body);
            return serialized.length() <= 800 ? serialized : serialized.substring(0, 800);
        } catch (Exception e) {
            return String.valueOf(body);
        }
    }

    private Slips emitirBoletoMock(Slips slip) {
        log.info("MOCK: emitindo boleto para {}", slip.getPayerName());
        slip.setIdBoletoIndividual(UUID.randomUUID().toString());
        slip.setBarCode("34199999900000150001790010010435100479102015");
        slip.setDigitableLine("34191.79001 01043.510047 91020.150008 8 99990000015000");
        slip.setStatus(SlipStatus.REGISTERED);
        return slip;
    }
}
