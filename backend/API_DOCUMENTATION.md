# Documentação da API - Sistema de Oficina

Esta documentação descreve todos os endpoints disponíveis na API do sistema de oficina, organizados por módulo.

## 1. Autenticação (`/auth`)

Responsável pelo login e registro de usuários e empresas.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `POST` | `/auth/login` | Realiza login e retorna token JWT. | `{"email": "...", "password": "..."}` |
| `POST` | `/auth/register` | Registra uma nova empresa e usuário admin. | `{"enterpriseName": "...", "adminName": "...", "email": "...", "password": "..."}` |

---

## 2. Clientes (`/clients`)

Gerenciamento de clientes da oficina.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `GET` | `/clients` | Lista clientes (paginado). Filtro opcional `?search=nome`. | - |
| `POST` | `/clients` | Cria um novo cliente. | `{"name": "...", "document": "...", "phone": "...", "email": "...", "address": {...}}` |
| `GET` | `/clients/{id}` | Busca cliente por ID. | - |
| `GET` | `/clients/document/{document}` | Busca cliente por CPF/CNPJ. | - |
| `PUT` | `/clients/{id}` | Atualiza dados do cliente. | `{"name": "...", "phone": "...", ...}` |
| `DELETE` | `/clients/{id}` | Remove (soft delete) um cliente. | - |
| `PATCH` | `/clients/{id}/reactivate` | Reativa um cliente excluído. | - |

---

## 3. Mecânicos (`/mechanics`)

Gerenciamento da equipe técnica.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `POST` | `/mechanics` | Cadastra um novo mecânico. | `{"name": "...", "commissionRate": 10.0}` |
| `GET` | `/mechanics/{id}` | Busca mecânico por ID. | - |
| `GET` | `/mechanics/active` | Lista todos os mecânicos ativos. | - |
| `PUT` | `/mechanics/{id}` | Atualiza dados do mecânico. | `{"name": "...", "commissionRate": 12.0}` |
| `PATCH` | `/mechanics/{id}/active` | Alterna status (Ativo/Inativo). | - |

---

## 4. Produtos e Serviços (`/items`)

Cadastro de peças e serviços oferecidos.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `POST` | `/items` | Cria um produto ou serviço. | `{"name": "...", "price": 100.0, "type": "PRODUCT" ou "SERVICE"}` |
| `GET` | `/items` | Lista todos os itens (paginado). | - |
| `GET` | `/items/{id}` | Busca item por ID. | - |
| `PUT` | `/items/{id}` | Atualiza item. | `{"name": "...", "price": 150.0}` |
| `PATCH` | `/items/{id}/active` | Alterna status (Ativo/Inativo). | - |
| `DELETE` | `/items/{id}` | Remove um item. | - |

---

## 5. Ordens de Serviço (`/service-orders`)

Fluxo principal de atendimento.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `POST` | `/service-orders` | Abre uma nova OS. | `{"clientId": "...", "mechanicId": "...", "vehiclePlate": "...", "description": "..."}` |
| `GET` | `/service-orders/{id}` | Busca OS por ID. | - |
| `POST` | `/service-orders/{id}/items` | Adiciona item (peça/serviço) à OS. | `{"itemId": "...", "quantity": 2, "discount": 0}` |
| `DELETE` | `/service-orders/{id}/items/{index}` | Remove item da OS pelo índice. | - |
| `PATCH` | `/service-orders/{id}/finish` | Finaliza a OS (gera financeiro). | - |
| `PATCH` | `/service-orders/{id}/cancel` | Cancela a OS. | - |

---

## 6. Financeiro (`/financial`)

Controle de contas a pagar e receber.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `GET` | `/financial/titles` | Lista títulos. Filtros: `?type=INCOME` ou `EXPENSE`. | - |
| `POST` | `/financial/titles` | Cria título manual. | `{"description": "...", "value": 100.0, "dueDate": "2024-01-01", "type": "EXPENSE"}` |
| `POST` | `/financial/titles/batch` | Cria título agrupado de várias OSs. | `{"osId": ["uuid1", "uuid2"]}` |
| `GET` | `/financial/titles/{id}` | Detalhes do título. | - |
| `PUT` | `/financial/titles/{id}` | Atualiza título. | `{"description": "...", "dueDate": "..."}` |
| `PATCH` | `/financial/titles/{id}/pay` | Baixa (pagamento) de título. | `{"paidValue": 100.0, "paymentDate": "2024-01-01"}` |
| `POST` | `/financial/titles/{id}/reverse` | Estorna pagamento. | - |
| `DELETE` | `/financial/titles/{id}` | Cancela título. | - |
| `POST` | `/financial/slips/manual` | Gera boleto avulso. | `{"clientId": "...", "value": 50.0, "dueDate": "2024-01-01"}` |

---

## 7. Boletos (`/slips`)

Gestão específica de boletos bancários (Integração Itaú).

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `POST` | `/slips/from-title/{titleId}` | Gera boleto a partir de um título existente. | - |
| `GET` | `/slips` | Busca boletos com filtros (data, status). | - |
| `GET` | `/slips/{id}` | Detalhes do boleto. | - |
| `GET` | `/slips/{id}/check-status-itau` | Consulta status real na API do Itaú. | - |
| `PATCH` | `/slips/{id}/cancel` | Cancela boleto. | - |
| `PATCH` | `/slips/{id}/mark-as-paid` | Baixa manual de boleto. | `{"paymentDate": "...", "paidValue": ...}` |

---

## 8. Comissões (`/commissions`)

Consulta de comissões de mecânicos.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `GET` | `/commissions/mechanic/{mechanicId}` | Lista comissões de um mecânico. | - |
| `GET` | `/commissions/os/{osId}` | Lista comissões geradas por uma OS. | - |

---

## 9. Dashboard (`/dashboard`)

Dados para gráficos e relatórios.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `GET` | `/dashboard/history` | Retorna snapshot financeiro dos últimos 30 dias. | - |

---

## 10. Logs de Auditoria (`/audit-logs`)

Histórico de ações realizadas no sistema.

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `GET` | `/audit-logs` | Lista logs paginados. Filtros: `page`, `size`, `sort`. | - |

---

## 11. Configurações (`/settings`)

Gerenciamento de configurações da empresa, usuário e integrações.

### Empresa (`/settings/enterprise`)

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `GET` | `/settings/enterprise` | Retorna dados da empresa logada. | - |
| `PUT` | `/settings/enterprise` | Atualiza dados da empresa. | `{"fantasyName": "...", "contact": {...}, "address": {...}}` |

### Usuário (`/settings/user`)

| Método | Endpoint | Descrição | Body (JSON) |
|---|---|---|---|
| `GET` | `/settings/user` | Retorna perfil do usuário logado. | - |
| `PUT` | `/settings/user` | Atualiza nome e senha. | `{"name": "...", "password": "..."}` |

### Integração Itaú (`/settings/itau`)

| Método | Endpoint | Descrição | Body (Form-Data) |
|---|---|---|---|
| `GET` | `/settings/itau` | Verifica status da configuração. | - |
| `POST` | `/settings/itau` | Salva credenciais e certificado. | `clientId` (text), `clientSecret` (text), `certificatePassword` (text), `certificate` (file .pfx) |
