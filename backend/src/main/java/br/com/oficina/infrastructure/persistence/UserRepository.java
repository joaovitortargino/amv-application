package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends MongoRepository<User, UUID> {

	Optional<User> findByEmail(String email);
	boolean existsByEmail(String email);
}
