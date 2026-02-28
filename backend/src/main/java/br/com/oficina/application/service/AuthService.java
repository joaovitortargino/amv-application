package br.com.oficina.application.service;

import br.com.oficina.application.dto.RegisterRequestDTO;
import br.com.oficina.domain.entities.Enterprise;
import br.com.oficina.domain.entities.User;
import br.com.oficina.domain.enums.Roles;
import br.com.oficina.infrastructure.persistence.EnterpriseRepository;
import br.com.oficina.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {
	private final UserRepository userRepository;
	private final EnterpriseRepository enterpriseRepository;
	
	private final PasswordEncoder passwordEncoder;

	public void registerEnterpriseAndAdmin(RegisterRequestDTO dto) {

		if (userRepository.existsByEmail(dto.email())) {
			throw new IllegalArgumentException("User already exists");
		}

		if (enterpriseRepository.existsByCnpj(dto.cnpj())) {
			throw new IllegalArgumentException("Enterprise already exists");
		}

		Enterprise enterprise = new Enterprise();

		enterprise.setCorporateReason(dto.corporateReason());
		enterprise.setFantasyName(dto.fantasyName());
		enterprise.setCnpj(dto.cnpj());
		enterprise.setAddress(dto.address());
		enterprise.setContact(dto.contact());
		enterprise.setCreatedAt(LocalDateTime.now());
		enterprise.setActive(true);

		Enterprise savedEnterprise = enterpriseRepository.save(enterprise);

		User user = new User();
		user.setName(dto.name());
		user.setEmail(dto.email());
		user.setPassword(passwordEncoder.encode(dto.password()));
		user.setEnterpriseId(savedEnterprise.getId());
		user.setRoles(Collections.singleton(Roles.ADMIN));
		user.setActive(true);

		userRepository.save(user);
	}
}
