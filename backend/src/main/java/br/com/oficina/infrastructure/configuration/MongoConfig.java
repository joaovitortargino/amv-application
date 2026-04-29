package br.com.oficina.infrastructure.configuration;

import br.com.oficina.domain.entities.Mechanic;
import org.bson.UuidRepresentation;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.PartialIndexFilter;
import org.springframework.data.mongodb.core.query.Criteria;

@Configuration
public class MongoConfig {
	@Bean
	public MongoClientSettingsBuilderCustomizer mongoClientSettingsBuilderCustomizer() {
		return builder -> builder.uuidRepresentation(UuidRepresentation.STANDARD);
	}

	@Bean
	public ApplicationRunner mechanicDocumentIndexRunner(MongoTemplate mongoTemplate) {
		return args -> {
			try {
				mongoTemplate.indexOps(Mechanic.class).dropIndex("enterprise_document_idx");
			} catch (Exception ignored) {
				// Index may not exist yet.
			}

			Index index = new Index()
					.on("enterpriseId", Sort.Direction.ASC)
					.on("document", Sort.Direction.ASC)
					.unique()
					.named("enterprise_document_idx")
					.partial(PartialIndexFilter.of(Criteria.where("document").exists(true).type(2).ne("")));

			mongoTemplate.indexOps(Mechanic.class).ensureIndex(index);
		};
	}
}
