package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.DashboardSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DashboardSnapshotRepository extends MongoRepository<DashboardSnapshot, UUID> {
    
    Optional<DashboardSnapshot> findByEnterpriseIdAndDate(UUID enterpriseId, LocalDate date);
    
    // Para gráficos: Buscar últimos 30 dias
    List<DashboardSnapshot> findByEnterpriseIdAndDateBetweenOrderByDateAsc(UUID enterpriseId, LocalDate start, LocalDate end);
}
