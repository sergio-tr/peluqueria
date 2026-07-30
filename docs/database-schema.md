# Database schema

## Extensiones

- `btree_gist` — exclusion constraints (scalar + range).
- `pgcrypto` — gen aleatorio si aplica.

## Tablas (todas con `salon_id` salvo auth nativa)

### salons
`id`, `name`, `slug`, `timezone` (`Europe/Madrid`), `address_json`, `phone`, `instagram`, `created_at`

### staff
`id`, `salon_id`, `display_name`, `auth_user_id` (nullable FK a auth.users), `active`, `created_at`

### services
`id`, `salon_id`, `slug`, `name`, `price_cents`, `base_minutes`, `requires_tryon` (bool), `active`, `sort_order`

### hairstyles
`id`, `salon_id`, `slug`, `name`,  
`catalog_image_path`, `ai_reference_image_path`,  
`source_url`, `source_author`, `source_license`, `license_checked_at`,  
`prompt_modifier`, `complexity` (`low|medium|high`), `extra_minutes`, `active`, `sort_order`

### ai_jobs
`id`, `salon_id`, `session_id`, `status` (`QUEUED|RUNNING|SUCCEEDED|FAILED`),  
`provider`, `model`, `external_prediction_id`, `reported_model_version`,  
`prompt_version`, `input_parameters_json` (sin signed URLs ni PII),  
`estimated_cost_usd`, `error_code`,  
`source_image_path`, `reference_image_path`, `result_image_path`,  
`consent_policy_version`, `ip_hash`,  
`created_at`, `updated_at`, `completed_at`

### booking_requests
`id`, `salon_id`, `staff_id`, `service_id`, `hairstyle_id` (nullable),  
`status`, `customer_name`, `customer_email`, `customer_phone`,  
`notes`, `source_image_path`, `result_image_path`,  
`requested_starts_at` (timestamptz UTC), `requested_ends_at`,  
`proposed_starts_at`, `proposed_ends_at`,  
`suggested_duration_minutes`, `final_duration_minutes`,  
`hold_expires_at`, `consent_policy_version`, `ai_job_id`,  
`created_at`, `updated_at`

### confirmation_tokens
`id`, `booking_request_id`, `token_hash`, `expires_at`, `used_at`, `created_at`

### demo_inbox_messages
`id`, `salon_id`, `booking_request_id`, `subject`, `body_summary`, `confirm_path`, `created_at`, `read_at`

### availability_rules
`id`, `salon_id`, `staff_id`, `weekday` (0=lun…6=dom o ISO documentado), `start_local` (time), `end_local` (time), `active`

### blocked_periods
`id`, `salon_id`, `staff_id`, `starts_at`, `ends_at`, `reason`

### booking_events
`id`, `salon_id`, `booking_request_id`, `from_status`, `to_status`, `actor_type`, `actor_id`, `payload_json`, `created_at`

### ai_usage_counters
`id`, `salon_id`, `period_type` (`day|month`), `period_key`, `ip_hash` (nullable para mes global), `count`, `unique (salon_id, period_type, period_key, ip_hash)`

## Solapes

Exclusion constraint sobre `booking_requests` activos en estados bloqueantes, usando `tstzrange(proposed_or_requested_start, end)` + `staff_id` con `btree_gist`.

Estados bloqueantes: `PENDING_BARBER_REVIEW`, `PENDING_CUSTOMER_CONFIRMATION`, `CONFIRMED`.

## RLS

- Anon/authenticated: sin acceso directo a Storage paths ni PII; solo vía Route Handlers con service role en servidor.
- Políticas explícitas denegando lectura pública de buckets privados.
- Admin: operaciones vía sesión Auth validada en API.

## Seed

1 salón Nowi, 1 staff, 5 services, 8 hairstyles (+ atribuciones), availability_rules mar–sáb, instrucciones admin user.
