package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.ServiceOrder;
import br.com.oficina.domain.enums.StatusOS;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceOrderRepository extends MongoRepository <ServiceOrder, UUID> {

	//busca OS pelo numero visual da tela (ex: "001"
	Optional<ServiceOrder> findByEnterpriseIdAndOSnumber(UUID enterpriseId, String OSnumber);

	//historico de todas de um cliente em especifco filtrado
	List<ServiceOrder> findByEnterpriseIdAndClientIdOrderByCreatedAtDesc(UUID enterpriseId, String clientId);

	//dados pra dash sobre as OS
	//TODO: NA DASH MOSTRAR SÓ "OPEN", "IN_PROGRESS"
	List<ServiceOrder> findByEnterpriseIdAndStatus(UUID enterpriseId, StatusOS status);

	//Relatorio OS aberta no intervalo de data
	List<ServiceOrder> findByEnterpriseIdAndCreatedAtBetween(UUID enterpriseId, LocalDateTime start, LocalDateTime end);

	//busca OS pela placa do veiculo vinculad
	@Query("{ 'enterpriseId': ?1, 'vehicle.plate': ?0 }")
	List<ServiceOrder> findByVehiclePlate(String plate, UUID enterpriseId);
	
	Optional<ServiceOrder> findByIdAndEnterpriseId(UUID id, UUID enterpriseId);

	List<ServiceOrder> findByEnterpriseId(UUID enterpriseId);
}
