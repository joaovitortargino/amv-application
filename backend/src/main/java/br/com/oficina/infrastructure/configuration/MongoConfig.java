package br.com.oficina.infrastructure.configuration;

import org.bson.UuidRepresentation;
import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MongoConfig {
	@Bean
	public MongoClientSettingsBuilderCustomizer mongoClientSettingsBuilderCustomizer() {
		return builder -> builder.uuidRepresentation(UuidRepresentation.STANDARD);
	}
}