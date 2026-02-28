package br.com.oficina.infrastructure.persistence;

import br.com.oficina.domain.entities.Slips;
import br.com.oficina.domain.enums.SlipStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SlipsRepository extends MongoRepository<Slips, UUID> {

    Optional<Slips> findByIdAndEnterpriseId(UUID id, UUID enterpriseId);

    Optional<Slips> findByOurNumber(String ourNumber);

    // Busca paginada e com filtros dinâmicos
    @Query("{ " +
            "  'enterpriseId': ?0, " +
            "  'dueDate': { $gte: ?1, $lte: ?2 }, " +
            "  'status': { $in: ?3 }, " +
            "  $or: [ " +
            "    { 'payerName': { $regex: ?4, $options: 'i' } }, " +
            "    { 'payerDocument': { $regex: ?4, $options: 'i' } } " +
            "  ] " +
            "}")
    Page<Slips> search(
            UUID enterpriseId,
            LocalDate dueDateStart,
            LocalDate dueDateEnd,
            List<SlipStatus> statuses,
            String payerInfo,
            Pageable pageable
    );
}
