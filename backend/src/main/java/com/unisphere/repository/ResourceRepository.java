package com.unisphere.repository;

import com.unisphere.entity.Resource;
import com.unisphere.entity.ResourceStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ResourceRepository extends JpaRepository<Resource, Long>, JpaSpecificationExecutor<Resource> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<Resource> findFirstByLocationIgnoreCaseAndStatusOrderByIdAsc(String location, ResourceStatus status);

    Optional<Resource> findFirstByStatusOrderByIdAsc(ResourceStatus status);

    Optional<Resource> findFirstByOrderByIdAsc();
}
