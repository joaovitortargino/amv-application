package br.com.oficina.domain.entities;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.UUID;

@Data
@Document(collection = "itau_configs")
public class ItauConfig {

    @Id
    private UUID id = UUID.randomUUID();

    @Indexed(unique = true)
    private UUID enterpriseId;

    private String clientId;
    private String clientSecret;
    
    // Armazena o arquivo .pfx em binário
    private byte[] certificateData;
    
    private String certificatePassword;
    
    private boolean active;
}
