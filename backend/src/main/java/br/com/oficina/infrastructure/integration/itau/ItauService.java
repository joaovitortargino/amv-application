package br.com.oficina.infrastructure.integration.itau;

import br.com.oficina.application.service.ItauConfigService;
import br.com.oficina.domain.entities.Client;
import br.com.oficina.domain.entities.ItauConfig;
import br.com.oficina.domain.entities.Slips;
import br.com.oficina.domain.enums.ClientType;
import br.com.oficina.domain.enums.SlipStatus;
import br.com.oficina.infrastructure.integration.itau.dto.ItauAuthResponse;
import br.com.oficina.infrastructure.integration.itau.dto.ItauBoletoRequest;
import br.com.oficina.infrastructure.integration.itau.dto.ItauBoletoResponse;
import br.com.oficina.infrastructure.integration.itau.dto.ItauErrorResponse;
import br.com.oficina.shared.exceptions.BusinessException;
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
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import javax.net.ssl.SSLContext;
import java.io.ByteArrayInputStream;
import java.security.KeyStore;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ItauService {

    private final ItauConfigService configService;
    
    @Value("${itau.url-auth:https://oauth.itau.com.br/identity/connect/token}")
    private String authUrl;

    @Value("${itau.url-api:https://api.itau.com.br/cash_management/v2/boletos}")
    private String apiUrl;
    
    @Value("${itau.mock-mode:false}")
    private boolean globalMockMode;

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Cache simples para evitar recriar SSLContext a cada requisição
    private final Map<UUID, RestTemplate> restTemplateCache = new ConcurrentHashMap<>();

    public Slips emitirBoleto(Slips slip, Client client) {
        ItauConfig config = configService.getConfigByEnterpriseId(slip.getEnterpriseId());
        
        if (config == null || !config.isActive()) {
            if (globalMockMode) {
                return emitirBoletoMock(slip);
            }
            throw new BusinessException("Integração Itaú não configurada ou inativa para esta empresa.");
        }

        RestTemplate restTemplate = getRestTemplateForEnterprise(config);
        String token = authenticate(restTemplate, config);
        
        ItauBoletoRequest request = buildRequest(slip, client);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);
        headers.set("x-itau-apikey", config.getClientId());
        headers.set("x-itau-correlationID", UUID.randomUUID().toString());

        HttpEntity<ItauBoletoRequest> entity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<ItauBoletoResponse> response = restTemplate.postForEntity(apiUrl, entity, ItauBoletoResponse.class);
            
            if (response.getBody() != null && response.getBody().data() != null) {
                var dados = response.getBody().data();
                
                slip.setIdBoletoIndividual(dados.idBoleto());
                slip.setBarCode(dados.codigoBarras());
                slip.setDigitableLine(dados.linhaDigitavel());
                slip.setStatus(SlipStatus.PENDING);
                return slip;
            }
            throw new BusinessException("Resposta inesperada do Itaú (corpo vazio).");

        } catch (HttpClientErrorException e) {
            handleItauError(e);
        } catch (Exception e) {
            log.error("Erro desconhecido ao emitir boleto Itau", e);
            throw new BusinessException("Erro na integração com Itaú: " + e.getMessage());
        }
        return null;
    }
    
    public ItauBoletoResponse consultarBoletoItau(String idBoletoIndividual) {
        // Para consulta, precisamos saber qual empresa está consultando para pegar o certificado correto.
        // Assumindo que quem chama já validou o contexto ou passamos o enterpriseId.
        // Como o método original não recebia enterpriseId, vou tentar pegar do contexto atual via configService.
        
        ItauConfig config = configService.getConfig(); // Pega do usuário logado
        
        if (config == null || !config.isActive()) {
             if (globalMockMode) {
                log.warn("MOCK MODE: Consulta de boleto não disponível.");
                return null;
            }
            throw new BusinessException("Configuração Itaú não encontrada.");
        }
        
        RestTemplate restTemplate = getRestTemplateForEnterprise(config);
        String token = authenticate(restTemplate, config);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.set("x-itau-apikey", config.getClientId());
        headers.set("x-itau-correlationID", UUID.randomUUID().toString());
        
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        
        String url = UriComponentsBuilder.fromHttpUrl(apiUrl)
                .queryParam("id_boleto_individual", idBoletoIndividual)
                .toUriString();

        try {
            ResponseEntity<ItauBoletoResponse> response = restTemplate.exchange(url, HttpMethod.GET, entity, ItauBoletoResponse.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            handleItauError(e);
        } catch (Exception e) {
            log.error("Erro ao consultar boleto no Itaú", e);
            throw new BusinessException("Erro na integração com Itaú: " + e.getMessage());
        }
        return null;
    }

    private RestTemplate getRestTemplateForEnterprise(ItauConfig config) {
        // Se já temos em cache, retorna (poderíamos adicionar lógica para invalidar se config mudar)
        if (restTemplateCache.containsKey(config.getEnterpriseId())) {
            return restTemplateCache.get(config.getEnterpriseId());
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

            HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
            RestTemplate restTemplate = new RestTemplate(factory);
            
            restTemplateCache.put(config.getEnterpriseId(), restTemplate);
            return restTemplate;

        } catch (Exception e) {
            log.error("Falha ao criar contexto SSL para empresa " + config.getEnterpriseId(), e);
            throw new BusinessException("Falha ao carregar certificado digital: " + e.getMessage());
        }
    }

    private void handleItauError(HttpClientErrorException e) {
        String errorBody = e.getResponseBodyAsString();
        log.error("Erro na chamada para o Itaú. Status: {}, Body: {}", e.getStatusCode(), errorBody);
        try {
            ItauErrorResponse errorResponse = objectMapper.readValue(errorBody, ItauErrorResponse.class);
            throw new BusinessException("Erro Itaú: " + errorResponse.getFormattedMessage());
        } catch (Exception parseException) {
            throw new BusinessException("Erro ao processar resposta de erro do Itaú: " + errorBody);
        }
    }

    private String authenticate(RestTemplate restTemplate, ItauConfig config) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "client_credentials");
        map.add("client_id", config.getClientId());
        map.add("client_secret", config.getClientSecret());

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);
        
        // A URL de auth as vezes não precisa de mTLS, mas geralmente precisa. Usamos o mesmo restTemplate.
        ResponseEntity<ItauAuthResponse> response = restTemplate.postForEntity(authUrl, request, ItauAuthResponse.class);

        return response.getBody().accessToken();
    }

    private ItauBoletoRequest buildRequest(Slips slip, Client client) {
        String valorFormatado = String.format("%.2f", slip.getValue()).replace(",", ".");
        String vencimento = slip.getDueDate().format(DateTimeFormatter.ISO_DATE);
        
        ItauBoletoRequest.Pessoa pessoa = new ItauBoletoRequest.Pessoa(
            client.getName(),
            client.getType() == ClientType.PJ ? "J" : "F",
            client.getType() == ClientType.PF ? client.getDocument() : null,
            client.getType() == ClientType.PJ ? client.getDocument() : null
        );

        ItauBoletoRequest.Endereco endereco = new ItauBoletoRequest.Endereco(
            client.getAddress().publicPlace(),
            client.getAddress().district(),
            client.getAddress().city(),
            client.getAddress().state(),
            client.getAddress().cep().replace("-", "")
        );

        ItauBoletoRequest.Pagador pagador = new ItauBoletoRequest.Pagador(pessoa, endereco);

        ItauBoletoRequest.DadosIndividuais dadosIndividuais = new ItauBoletoRequest.DadosIndividuais(
            slip.getOurNumber(),
            vencimento,
            valorFormatado,
            pagador
        );

        ItauBoletoRequest.DadoBoleto dadoBoleto = new ItauBoletoRequest.DadoBoleto(
            "boleto",
            "a vista",
            "109",
            valorFormatado,
            List.of(dadosIndividuais)
        );

        return new ItauBoletoRequest(
            new ItauBoletoRequest.ItauBoletoData(
                "BKL",
                "efetivacao",
                dadoBoleto
            )
        );
    }

    private Slips emitirBoletoMock(Slips slip) {
        log.info("MOCK: Emitindo boleto para {}", slip.getPayerName());
        slip.setIdBoletoIndividual(UUID.randomUUID().toString());
        slip.setBarCode("34191.79001 01043.510047 91020.150008 8 99990000015000");
        slip.setDigitableLine("34191.79001 01043.510047 91020.150008 8 99990000015000");
        slip.setStatus(SlipStatus.PENDING);
        return slip;
    }
}
