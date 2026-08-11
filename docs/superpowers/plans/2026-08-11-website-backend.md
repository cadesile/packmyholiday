# Take My Holiday Website & Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a new Symfony repo (`packmyholiday-backend`) that serves a public single-page site (features, privacy policy, contact + beta-request forms) and an `/admin`-gated, versioned `/api/v1` backend for managing and serving packing-item content to the mobile app, deployed to Hetzner via Docker.

**Architecture:** One Symfony 7 (PHP 8.4) application, one Postgres 16 database, one Docker image. `PackingItem` and `BetaRequest` are the only two entities. Admin CRUD uses hand-written controllers/forms (no EasyAdminBundle). The public site is server-rendered Twig + Symfony AssetMapper/Stimulus (no Node build). Deployment mirrors the sibling `wunderkind-backend` repo's Hetzner/Docker Compose/GitHub Actions setup, with JWT and social-auth pieces stripped out since there is no end-user auth here.

**Tech Stack:** Symfony 7, PHP 8.4, Doctrine ORM/Migrations, Postgres 16, Symfony Mailer, Symfony AssetMapper + Stimulus, PHPUnit, Lando (local dev), Docker + GitHub Actions (deploy to Hetzner).

**Full design reference:** `docs/superpowers/specs/2026-08-11-website-backend-design.md` in the `packmyholiday` (mobile app) repo — read it before starting if anything below is ambiguous.

## Global Constraints

- This plan runs inside an **already-created, empty git repo** named `packmyholiday-backend` (sibling to the `packmyholiday` mobile app repo) — the repo directory and `git init` are done before this plan starts. Operate from that repo's root (wherever the session was started); do not create or `cd` into a new directory.
- `PackingItem.type` values: `luggage | clothing | toiletries | electronics | footwear | essentials` (mirrors `PackingItem['category']` in the mobile app's `src/types/packing.ts`).
- `PackingItem.climate` values: `warm | cold | temperate | any`.
- Admin auth is HTTP Basic only — no login form, no session, single shared credential pair from `ADMIN_USER` / `ADMIN_PASSWORD_HASH` env vars. Never hardcode credentials in code.
- API is versioned under `/api/v1/...` from the first endpoint — do not add unversioned routes.
- `GET /api/v1/items` is public and unauthenticated; it must only return `active = true` items.
- Beta access is **double opt-in only** — no manual admin-approval step anywhere in this plan.
- Deployment secrets (`DB_PASSWORD`, `APP_SECRET`, `MAILER_DSN`, `ADMIN_USER`, `ADMIN_PASSWORD_HASH`) are supplied via GitHub Actions secrets and written to a server-side `.env` at deploy time — never committed.
- Follow the `wunderkind-backend` repo's Docker/Compose/CI shape (`/Users/courtneyadesile/Documents/WunderkindFactory/wunderkind-backend`) wherever this plan says "mirror wunderkind-backend," minus JWT keys, social-auth env vars, and cron jobs — none of that applies to this project.
- Run all PHP/Symfony commands through Lando (`lando php`, `lando composer`, `lando symfony`) once Task 1 sets it up, not bare `php`/`composer`, so they run inside the container with the right PHP version and DB connectivity.

---

### Task 1: Scaffold the Symfony project and Lando

**Files:**
- Create: Symfony project skeleton in the current repo root (via `symfony new .`)
- Create: `.lando.yml`
- Create: `.gitignore` (Symfony default + `.env.local`)
- Create: `README.md`

**Interfaces:**
- Consumes: nothing (first task). Assumes the working directory is already an initialized, empty git repo named `packmyholiday-backend`.
- Produces: a bootable Symfony skeleton in the repo root with Doctrine, Twig, Mailer, and AssetMapper installed; a working Lando environment other tasks assume exists. Later tasks assume `lando start` gives a running app + Postgres.

- [ ] **Step 1: Scaffold Symfony into the current (already-created) repo**

```bash
symfony new . --version=7.1 --webapp
```

Run this from the repo root — do not create a new directory or `cd` elsewhere first. `--webapp` pulls in Twig, forms, mailer, validator — all needed here.

- [ ] **Step 2: Add Doctrine (ORM + migrations + Postgres driver) and AssetMapper/Stimulus**

```bash
composer require symfony/orm-pack doctrine/doctrine-migrations-bundle symfony/asset-mapper symfony/stimulus-bundle symfony/ux-turbo
composer require --dev symfony/maker-bundle symfony/test-pack
```

- [ ] **Step 3: Create `.lando.yml`**

```yaml
name: packmyholiday-backend
recipe: symfony
config:
  php: '8.4'
  via: nginx
  webroot: public
  xdebug: false
  database: postgres:16

services:
  appserver_nginx:
    overrides:
      ports:
        - "127.0.0.1:52200:80"

  database:
    portforward: 5434
    creds:
      user: packmyholiday
      password: packmyholiday
      database: packmyholiday

tooling:
  php:
    service: appserver
  composer:
    service: appserver
  symfony:
    service: appserver
    cmd: php bin/console
  psql:
    service: database
    cmd: psql -U packmyholiday packmyholiday
```

- [ ] **Step 4: Start Lando and point `DATABASE_URL` at it**

```bash
lando start
```

Edit `.env.local` (create if absent, it's gitignored):

```
DATABASE_URL="postgresql://packmyholiday:packmyholiday@database:5432/packmyholiday?serverVersion=16&charset=utf8"
```

- [ ] **Step 5: Verify the skeleton boots**

Run: `lando symfony -- about` (or open `http://localhost:52200` in a browser)
Expected: Symfony welcome/about output with no errors, confirming the container, PHP version, and DB connection all work.

- [ ] **Step 6: Write a minimal `README.md`**

```markdown
# packmyholiday-backend

Symfony backend for the Take My Holiday app: public site (privacy policy,
contact/beta forms) + `/admin` packing-item management + versioned
`/api/v1` content API consumed by the mobile app.

## Local dev

    lando start
    lando composer install
    lando symfony -- doctrine:migrations:migrate

Site: http://localhost:52200
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Symfony project with Doctrine, AssetMapper, and Lando"
```

---

### Task 2: `PackingItem` entity, migration, repository, and unit test

**Files:**
- Create: `src/Entity/PackingItemType.php`
- Create: `src/Entity/PackingItemClimate.php`
- Create: `src/Entity/PackingItem.php`
- Create: `src/Repository/PackingItemRepository.php`
- Create: `migrations/VersionXXXXXXXXXXXXXX.php` (generated)
- Test: `tests/Entity/PackingItemTest.php`

**Interfaces:**
- Consumes: nothing new.
- Produces: `PackingItem` with constructor `__construct(string $name, PackingItemType $type, int $weightGrams, PackingItemClimate $climate)`, getters `getId()`, `getName()`, `getType(): PackingItemType`, `getWeightGrams(): int`, `getClimate(): PackingItemClimate`, `isActive(): bool`, `getCreatedAt()`, `getUpdatedAt()`, and setters `setName`, `setType`, `setWeightGrams`, `setClimate`, `setActive(bool)` (setActive also bumps `updatedAt`). `PackingItemRepository::findActive(?PackingItemType $type = null, ?PackingItemClimate $climate = null): array`. Tasks 6 (API), 5 (seed), and 10 (admin) all depend on these exact names.

- [ ] **Step 1: Create the enums**

`src/Entity/PackingItemType.php`:
```php
<?php

namespace App\Entity;

enum PackingItemType: string
{
    case Luggage = 'luggage';
    case Clothing = 'clothing';
    case Toiletries = 'toiletries';
    case Electronics = 'electronics';
    case Footwear = 'footwear';
    case Essentials = 'essentials';
}
```

`src/Entity/PackingItemClimate.php`:
```php
<?php

namespace App\Entity;

enum PackingItemClimate: string
{
    case Warm = 'warm';
    case Cold = 'cold';
    case Temperate = 'temperate';
    case Any = 'any';
}
```

- [ ] **Step 2: Write the failing entity test**

`tests/Entity/PackingItemTest.php`:
```php
<?php

namespace App\Tests\Entity;

use App\Entity\PackingItem;
use App\Entity\PackingItemClimate;
use App\Entity\PackingItemType;
use PHPUnit\Framework\TestCase;

class PackingItemTest extends TestCase
{
    public function testConstructorSetsFieldsAndTimestamps(): void
    {
        $item = new PackingItem('T-Shirt / Top', PackingItemType::Clothing, 180, PackingItemClimate::Any);

        $this->assertSame('T-Shirt / Top', $item->getName());
        $this->assertSame(PackingItemType::Clothing, $item->getType());
        $this->assertSame(180, $item->getWeightGrams());
        $this->assertSame(PackingItemClimate::Any, $item->getClimate());
        $this->assertTrue($item->isActive());
        $this->assertInstanceOf(\DateTimeImmutable::class, $item->getCreatedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $item->getUpdatedAt());
    }

    public function testSetActiveBumpsUpdatedAt(): void
    {
        $item = new PackingItem('Jacket', PackingItemType::Clothing, 700, PackingItemClimate::Cold);
        $originalUpdatedAt = $item->getUpdatedAt();

        usleep(1000);
        $item->setActive(false);

        $this->assertFalse($item->isActive());
        $this->assertGreaterThan($originalUpdatedAt, $item->getUpdatedAt());
    }
}
```

- [ ] **Step 2b: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Entity/PackingItemTest.php`
Expected: FAIL — class `App\Entity\PackingItem` not found.

- [ ] **Step 3: Create the entity**

`src/Entity/PackingItem.php`:
```php
<?php

namespace App\Entity;

use App\Repository\PackingItemRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PackingItemRepository::class)]
#[ORM\Table(name: 'packing_item')]
class PackingItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name;

    #[ORM\Column(length: 32, enumType: PackingItemType::class)]
    private PackingItemType $type;

    #[ORM\Column]
    private int $weightGrams;

    #[ORM\Column(length: 16, enumType: PackingItemClimate::class)]
    private PackingItemClimate $climate;

    #[ORM\Column]
    private bool $active = true;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    public function __construct(string $name, PackingItemType $type, int $weightGrams, PackingItemClimate $climate)
    {
        $this->name = $name;
        $this->type = $type;
        $this->weightGrams = $weightGrams;
        $this->climate = $climate;
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; $this->touch(); return $this; }

    public function getType(): PackingItemType { return $this->type; }
    public function setType(PackingItemType $type): static { $this->type = $type; $this->touch(); return $this; }

    public function getWeightGrams(): int { return $this->weightGrams; }
    public function setWeightGrams(int $weightGrams): static { $this->weightGrams = $weightGrams; $this->touch(); return $this; }

    public function getClimate(): PackingItemClimate { return $this->climate; }
    public function setClimate(PackingItemClimate $climate): static { $this->climate = $climate; $this->touch(); return $this; }

    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): static { $this->active = $active; $this->touch(); return $this; }

    public function getCreatedAt(): \DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): \DateTimeImmutable { return $this->updatedAt; }

    private function touch(): void { $this->updatedAt = new \DateTimeImmutable(); }
}
```

- [ ] **Step 4: Create the repository**

`src/Repository/PackingItemRepository.php`:
```php
<?php

namespace App\Repository;

use App\Entity\PackingItem;
use App\Entity\PackingItemClimate;
use App\Entity\PackingItemType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PackingItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PackingItem::class);
    }

    /** @return PackingItem[] */
    public function findActive(?PackingItemType $type = null, ?PackingItemClimate $climate = null): array
    {
        $qb = $this->createQueryBuilder('i')
            ->andWhere('i.active = true')
            ->orderBy('i.name', 'ASC');

        if ($type !== null) {
            $qb->andWhere('i.type = :type')->setParameter('type', $type);
        }
        if ($climate !== null) {
            $qb->andWhere('i.climate = :climate')->setParameter('climate', $climate);
        }

        return $qb->getQuery()->getResult();
    }
}
```

- [ ] **Step 5: Run the entity test to confirm it passes**

Run: `lando php bin/phpunit tests/Entity/PackingItemTest.php`
Expected: PASS (2 tests)

- [ ] **Step 6: Generate and run the migration**

```bash
lando symfony -- make:migration
lando symfony -- doctrine:migrations:migrate --no-interaction
```

Expected: migration file created under `migrations/`, applies cleanly, `packing_item` table exists (verify with `lando psql -c '\d packing_item'`).

- [ ] **Step 7: Commit**

```bash
git add src/Entity/PackingItem.php src/Entity/PackingItemType.php src/Entity/PackingItemClimate.php src/Repository/PackingItemRepository.php migrations/ tests/Entity/PackingItemTest.php
git commit -m "feat: add PackingItem entity, repository, and migration"
```

---

### Task 3: `BetaRequest` entity, migration, and repository

**Files:**
- Create: `src/Entity/BetaRequestStatus.php`
- Create: `src/Entity/BetaRequest.php`
- Create: `src/Repository/BetaRequestRepository.php`
- Create: `migrations/VersionXXXXXXXXXXXXXX.php` (generated)
- Test: `tests/Entity/BetaRequestTest.php`

**Interfaces:**
- Consumes: nothing new.
- Produces: `BetaRequest` with constructor `__construct(string $email)` that generates a random `confirmationToken` and sets `status = Pending`. Methods: `getId()`, `getEmail()`, `getStatus(): BetaRequestStatus`, `getConfirmationToken(): string`, `getRequestedAt()`, `getConfirmedAt(): ?\DateTimeImmutable`, `confirm(): void` (sets status to `Confirmed` and `confirmedAt` to now; throws `\LogicException` if already confirmed). `BetaRequestRepository::findOneByEmail(string $email): ?BetaRequest`, `findOneByToken(string $token): ?BetaRequest`. Task 7 (beta-request API) and Task 8 (confirm endpoint) depend on these exact names.

- [ ] **Step 1: Create the status enum**

`src/Entity/BetaRequestStatus.php`:
```php
<?php

namespace App\Entity;

enum BetaRequestStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
}
```

- [ ] **Step 2: Write the failing entity test**

`tests/Entity/BetaRequestTest.php`:
```php
<?php

namespace App\Tests\Entity;

use App\Entity\BetaRequest;
use App\Entity\BetaRequestStatus;
use PHPUnit\Framework\TestCase;

class BetaRequestTest extends TestCase
{
    public function testConstructorGeneratesTokenAndPendingStatus(): void
    {
        $request = new BetaRequest('user@example.com');

        $this->assertSame('user@example.com', $request->getEmail());
        $this->assertSame(BetaRequestStatus::Pending, $request->getStatus());
        $this->assertNotEmpty($request->getConfirmationToken());
        $this->assertNull($request->getConfirmedAt());
    }

    public function testConfirmSetsStatusAndTimestamp(): void
    {
        $request = new BetaRequest('user@example.com');

        $request->confirm();

        $this->assertSame(BetaRequestStatus::Confirmed, $request->getStatus());
        $this->assertInstanceOf(\DateTimeImmutable::class, $request->getConfirmedAt());
    }

    public function testConfirmTwiceThrows(): void
    {
        $request = new BetaRequest('user@example.com');
        $request->confirm();

        $this->expectException(\LogicException::class);
        $request->confirm();
    }
}
```

- [ ] **Step 2b: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Entity/BetaRequestTest.php`
Expected: FAIL — class not found.

- [ ] **Step 3: Create the entity**

`src/Entity/BetaRequest.php`:
```php
<?php

namespace App\Entity;

use App\Repository\BetaRequestRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BetaRequestRepository::class)]
#[ORM\Table(name: 'beta_request')]
class BetaRequest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $email;

    #[ORM\Column(length: 16, enumType: BetaRequestStatus::class)]
    private BetaRequestStatus $status;

    #[ORM\Column(length: 64, unique: true)]
    private string $confirmationToken;

    #[ORM\Column]
    private \DateTimeImmutable $requestedAt;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $confirmedAt = null;

    public function __construct(string $email)
    {
        $this->email = $email;
        $this->status = BetaRequestStatus::Pending;
        $this->confirmationToken = bin2hex(random_bytes(32));
        $this->requestedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }
    public function getEmail(): string { return $this->email; }
    public function getStatus(): BetaRequestStatus { return $this->status; }
    public function getConfirmationToken(): string { return $this->confirmationToken; }
    public function getRequestedAt(): \DateTimeImmutable { return $this->requestedAt; }
    public function getConfirmedAt(): ?\DateTimeImmutable { return $this->confirmedAt; }

    public function confirm(): void
    {
        if ($this->status === BetaRequestStatus::Confirmed) {
            throw new \LogicException('Beta request is already confirmed.');
        }
        $this->status = BetaRequestStatus::Confirmed;
        $this->confirmedAt = new \DateTimeImmutable();
    }
}
```

- [ ] **Step 4: Create the repository**

`src/Repository/BetaRequestRepository.php`:
```php
<?php

namespace App\Repository;

use App\Entity\BetaRequest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class BetaRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BetaRequest::class);
    }

    public function findOneByEmail(string $email): ?BetaRequest
    {
        return $this->findOneBy(['email' => $email]);
    }

    public function findOneByToken(string $token): ?BetaRequest
    {
        return $this->findOneBy(['confirmationToken' => $token]);
    }
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `lando php bin/phpunit tests/Entity/BetaRequestTest.php`
Expected: PASS (3 tests)

- [ ] **Step 6: Generate and run the migration**

```bash
lando symfony -- make:migration
lando symfony -- doctrine:migrations:migrate --no-interaction
```

Expected: `beta_request` table exists with a unique index on `confirmation_token`.

- [ ] **Step 7: Commit**

```bash
git add src/Entity/BetaRequest.php src/Entity/BetaRequestStatus.php src/Repository/BetaRequestRepository.php migrations/ tests/Entity/BetaRequestTest.php
git commit -m "feat: add BetaRequest entity, repository, and migration"
```

---

### Task 4: `GET /api/v1/items` public read endpoint

**Files:**
- Create: `src/Controller/Api/ItemsController.php`
- Test: `tests/Controller/Api/ItemsControllerTest.php`

**Interfaces:**
- Consumes: `PackingItemRepository::findActive()` from Task 2.
- Produces: route `items_index` at `GET /api/v1/items`, JSON array of `{id, name, type, weightGrams, climate}`. Nothing downstream depends on this beyond the mobile app (out of scope for this plan) and the functional test.

- [ ] **Step 1: Write the failing functional test**

`tests/Controller/Api/ItemsControllerTest.php`:
```php
<?php

namespace App\Tests\Controller\Api;

use App\Entity\PackingItem;
use App\Entity\PackingItemClimate;
use App\Entity\PackingItemType;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ItemsControllerTest extends WebTestCase
{
    public function testReturnsOnlyActiveItems(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $active = new PackingItem('T-Shirt / Top', PackingItemType::Clothing, 180, PackingItemClimate::Any);
        $inactive = new PackingItem('Old Item', PackingItemType::Essentials, 50, PackingItemClimate::Any);
        $inactive->setActive(false);
        $em->persist($active);
        $em->persist($inactive);
        $em->flush();

        $client->request('GET', '/api/v1/items');

        $this->assertResponseIsSuccessful();
        $data = json_decode($client->getResponse()->getContent(), true);
        $names = array_column($data, 'name');
        $this->assertContains('T-Shirt / Top', $names);
        $this->assertNotContains('Old Item', $names);
    }

    public function testFiltersByClimate(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $em->persist(new PackingItem('Jacket', PackingItemType::Clothing, 700, PackingItemClimate::Cold));
        $em->persist(new PackingItem('Sunscreen', PackingItemType::Toiletries, 100, PackingItemClimate::Warm));
        $em->flush();

        $client->request('GET', '/api/v1/items?climate=warm');

        $data = json_decode($client->getResponse()->getContent(), true);
        $names = array_column($data, 'name');
        $this->assertContains('Sunscreen', $names);
        $this->assertNotContains('Jacket', $names);
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Controller/Api/ItemsControllerTest.php`
Expected: FAIL — route not found / 404.

- [ ] **Step 3: Create the controller**

`src/Controller/Api/ItemsController.php`:
```php
<?php

namespace App\Controller\Api;

use App\Entity\PackingItemClimate;
use App\Entity\PackingItemType;
use App\Repository\PackingItemRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

class ItemsController
{
    public function __construct(private readonly PackingItemRepository $items) {}

    #[Route('/api/v1/items', name: 'items_index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $type = $request->query->has('type')
            ? PackingItemType::tryFrom($request->query->getString('type'))
            : null;
        $climate = $request->query->has('climate')
            ? PackingItemClimate::tryFrom($request->query->getString('climate'))
            : null;

        $items = array_map(
            static fn ($item) => [
                'id' => $item->getId(),
                'name' => $item->getName(),
                'type' => $item->getType()->value,
                'weightGrams' => $item->getWeightGrams(),
                'climate' => $item->getClimate()->value,
            ],
            $this->items->findActive($type, $climate),
        );

        return new JsonResponse($items);
    }
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `lando php bin/phpunit tests/Controller/Api/ItemsControllerTest.php`
Expected: PASS (2 tests)

Note: this requires a working test database. Before running functional tests for the first time, set `DATABASE_URL` in `.env.test.local` to a separate test DB and run `lando symfony -- doctrine:database:create --env=test && lando symfony -- doctrine:migrations:migrate --env=test --no-interaction`.

- [ ] **Step 5: Commit**

```bash
git add src/Controller/Api/ItemsController.php tests/Controller/Api/ItemsControllerTest.php
git commit -m "feat: add GET /api/v1/items public endpoint"
```

---

### Task 5: Mailer configuration and a shared `MailerInterface`-based notifier

**Files:**
- Modify: `.env` (add `MAILER_DSN`, `MAILER_FROM`, `MAILER_FROM_NAME` placeholders — real values live in `.env.local`/prod secrets)
- Create: `src/Service/AppMailer.php`
- Test: `tests/Service/AppMailerTest.php`

**Interfaces:**
- Consumes: Symfony `MailerInterface` (already available from the `--webapp` skeleton).
- Produces: `AppMailer::sendBetaConfirmation(string $toEmail, string $confirmUrl): void` and `AppMailer::sendContactNotification(string $fromName, string $fromEmail, string $message): void`. Tasks 7 (beta request) and 11 (contact form) call these.

- [ ] **Step 1: Add mailer env placeholders**

Append to `.env`:
```
MAILER_DSN=smtp://localhost
MAILER_FROM=noreply@example.com
MAILER_FROM_NAME="Take My Holiday"
```

- [ ] **Step 2: Write the failing test using Symfony's test transport**

`tests/Service/AppMailerTest.php`:
```php
<?php

namespace App\Tests\Service;

use App\Service\AppMailer;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Mailer\Transport\TransportInterface;
use Symfony\Component\Mime\Email;

class AppMailerTest extends KernelTestCase
{
    public function testSendBetaConfirmationSendsExpectedEmail(): void
    {
        self::bootKernel();
        $mailer = static::getContainer()->get(AppMailer::class);

        $mailer->sendBetaConfirmation('user@example.com', 'https://example.com/beta/confirm/abc123');

        /** @var \Symfony\Component\Mailer\EventListener\MessageEvent[] $events */
        $messages = self::getContainer()->get('mailer')->getTransport();
        $this->assertInstanceOf(TransportInterface::class, $messages);
    }
}
```

(This test only asserts the service is wired and callable without throwing — full delivery assertions happen via functional tests in Tasks 7/11 using `MailerAssertionsTrait`.)

- [ ] **Step 2b: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Service/AppMailerTest.php`
Expected: FAIL — `App\Service\AppMailer` not found.

- [ ] **Step 3: Create the mailer service**

`src/Service/AppMailer.php`:
```php
<?php

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

class AppMailer
{
    public function __construct(
        private readonly MailerInterface $mailer,
        private readonly string $mailerFrom,
        private readonly string $mailerFromName,
    ) {}

    public function sendBetaConfirmation(string $toEmail, string $confirmUrl): void
    {
        $email = (new Email())
            ->from(sprintf('%s <%s>', $this->mailerFromName, $this->mailerFrom))
            ->to($toEmail)
            ->subject('Confirm your Take My Holiday beta request')
            ->text("Confirm your beta access request by visiting:\n\n{$confirmUrl}\n\nIf you didn't request this, you can ignore this email.");

        $this->mailer->send($email);
    }

    public function sendContactNotification(string $fromName, string $fromEmail, string $message): void
    {
        $email = (new Email())
            ->from(sprintf('%s <%s>', $this->mailerFromName, $this->mailerFrom))
            ->to($this->mailerFrom)
            ->replyTo($fromEmail)
            ->subject("Contact form message from {$fromName}")
            ->text($message);

        $this->mailer->send($email);
    }
}
```

- [ ] **Step 4: Wire the constructor args in `config/services.yaml`**

Add under `parameters:`:
```yaml
parameters:
    app.mailer_from: '%env(MAILER_FROM)%'
    app.mailer_from_name: '%env(MAILER_FROM_NAME)%'
```

Add under `services:` (after the default `App\` autowire block):
```yaml
    App\Service\AppMailer:
        arguments:
            $mailerFrom: '%app.mailer_from%'
            $mailerFromName: '%app.mailer_from_name%'
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `lando php bin/phpunit tests/Service/AppMailerTest.php`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add .env config/services.yaml src/Service/AppMailer.php tests/Service/AppMailerTest.php
git commit -m "feat: add AppMailer service for beta confirmation and contact notifications"
```

---

### Task 6: `POST /api/v1/beta-requests` endpoint

**Files:**
- Create: `src/Controller/Api/BetaRequestsController.php`
- Test: `tests/Controller/Api/BetaRequestsControllerTest.php`

**Interfaces:**
- Consumes: `BetaRequest` (Task 3), `BetaRequestRepository::findOneByEmail` (Task 3), `AppMailer::sendBetaConfirmation` (Task 5), Symfony `UrlGeneratorInterface`.
- Produces: route `beta_requests_create` at `POST /api/v1/beta-requests`. Task 8's confirm endpoint consumes the same `BetaRequest` records this creates.

- [ ] **Step 1: Write the failing functional test**

`tests/Controller/Api/BetaRequestsControllerTest.php`:
```php
<?php

namespace App\Tests\Controller\Api;

use App\Repository\BetaRequestRepository;
use Symfony\Bundle\FrameworkBundle\Test\MailerAssertionsTrait;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class BetaRequestsControllerTest extends WebTestCase
{
    use MailerAssertionsTrait;

    public function testCreatesRequestAndSendsConfirmationEmail(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/v1/beta-requests', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['email' => 'new@example.com']));

        $this->assertResponseStatusCodeSame(201);
        $this->assertEmailCount(1);

        /** @var BetaRequestRepository $repo */
        $repo = static::getContainer()->get(BetaRequestRepository::class);
        $this->assertNotNull($repo->findOneByEmail('new@example.com'));
    }

    public function testDuplicateEmailReturns200WithoutNewRow(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/v1/beta-requests', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['email' => 'dup@example.com']));
        $client->request('POST', '/api/v1/beta-requests', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode(['email' => 'dup@example.com']));

        $this->assertResponseIsSuccessful();

        /** @var BetaRequestRepository $repo */
        $repo = static::getContainer()->get(BetaRequestRepository::class);
        $this->assertNotNull($repo->findOneByEmail('dup@example.com'));
    }

    public function testMissingEmailReturns422(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/v1/beta-requests', [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([]));

        $this->assertResponseStatusCodeSame(422);
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Controller/Api/BetaRequestsControllerTest.php`
Expected: FAIL — route not found.

- [ ] **Step 3: Create the controller**

`src/Controller/Api/BetaRequestsController.php`:
```php
<?php

namespace App\Controller\Api;

use App\Entity\BetaRequest;
use App\Repository\BetaRequestRepository;
use App\Service\AppMailer;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class BetaRequestsController
{
    public function __construct(
        private readonly BetaRequestRepository $betaRequests,
        private readonly EntityManagerInterface $em,
        private readonly AppMailer $mailer,
        private readonly UrlGeneratorInterface $urlGenerator,
    ) {}

    #[Route('/api/v1/beta-requests', name: 'beta_requests_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $payload = json_decode($request->getContent(), true) ?? [];
        $email = trim((string) ($payload['email'] ?? ''));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['error' => 'A valid email is required.'], 422);
        }

        $existing = $this->betaRequests->findOneByEmail($email);
        if ($existing !== null) {
            $this->sendConfirmationFor($existing);
            return new JsonResponse(['status' => $existing->getStatus()->value], 200);
        }

        $betaRequest = new BetaRequest($email);
        $this->em->persist($betaRequest);
        $this->em->flush();

        $this->sendConfirmationFor($betaRequest);

        return new JsonResponse(['status' => $betaRequest->getStatus()->value], 201);
    }

    private function sendConfirmationFor(BetaRequest $betaRequest): void
    {
        if ($betaRequest->getStatus()->value === 'confirmed') {
            return;
        }
        $confirmUrl = $this->urlGenerator->generate(
            'beta_confirm',
            ['token' => $betaRequest->getConfirmationToken()],
            UrlGeneratorInterface::ABSOLUTE_URL,
        );
        $this->mailer->sendBetaConfirmation($betaRequest->getEmail(), $confirmUrl);
    }
}
```

Note: this references route `beta_confirm`, created in Task 7 — the two tasks must land together before this compiles/tests pass; if executing task-by-task, stub the route in this task's step 3 with a placeholder controller and let Task 7 replace it, OR reorder Task 7 before this task. This plan reorders: **do Task 7 (confirm endpoint) before running this task's tests.**

- [ ] **Step 4: Run the test to confirm it passes** (after Task 7 is also done, since `beta_confirm` route must exist)

Run: `lando php bin/phpunit tests/Controller/Api/BetaRequestsControllerTest.php`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/Controller/Api/BetaRequestsController.php tests/Controller/Api/BetaRequestsControllerTest.php
git commit -m "feat: add POST /api/v1/beta-requests with double opt-in email"
```

---

### Task 7: `GET /beta/confirm/{token}` confirmation endpoint

**Files:**
- Create: `src/Controller/BetaConfirmController.php`
- Create: `templates/beta/confirmed.html.twig`
- Create: `templates/beta/invalid.html.twig`
- Test: `tests/Controller/BetaConfirmControllerTest.php`

**Interfaces:**
- Consumes: `BetaRequestRepository::findOneByToken` and `BetaRequest::confirm()` from Task 3.
- Produces: route `beta_confirm` at `GET /beta/confirm/{token}`, which Task 6 references when building the confirmation email link.

**Do this task before finishing Task 6's test run** — Task 6 depends on the `beta_confirm` route existing.

- [ ] **Step 1: Write the failing functional test**

`tests/Controller/BetaConfirmControllerTest.php`:
```php
<?php

namespace App\Tests\Controller;

use App\Entity\BetaRequest;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class BetaConfirmControllerTest extends WebTestCase
{
    public function testValidTokenConfirmsAndShowsSuccess(): void
    {
        $client = static::createClient();
        $em = static::getContainer()->get('doctrine')->getManager();

        $betaRequest = new BetaRequest('confirm-me@example.com');
        $em->persist($betaRequest);
        $em->flush();

        $client->request('GET', '/beta/confirm/' . $betaRequest->getConfirmationToken());

        $this->assertResponseIsSuccessful();
        $em->refresh($betaRequest);
        $this->assertSame('confirmed', $betaRequest->getStatus()->value);
    }

    public function testInvalidTokenShowsFriendlyError(): void
    {
        $client = static::createClient();

        $client->request('GET', '/beta/confirm/not-a-real-token');

        $this->assertResponseStatusCodeSame(404);
        $this->assertStringNotContainsString('Exception', (string) $client->getResponse()->getContent());
    }
}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Controller/BetaConfirmControllerTest.php`
Expected: FAIL — route not found.

- [ ] **Step 3: Create the templates**

`templates/beta/confirmed.html.twig`:
```twig
{% extends 'base.html.twig' %}
{% block title %}Beta access confirmed{% endblock %}
{% block body %}
<main class="confirm-page">
    <h1>You're in!</h1>
    <p>Your email is confirmed for Take My Holiday beta access. We'll be in touch with your invite shortly.</p>
</main>
{% endblock %}
```

`templates/beta/invalid.html.twig`:
```twig
{% extends 'base.html.twig' %}
{% block title %}Link not valid{% endblock %}
{% block body %}
<main class="confirm-page">
    <h1>That link isn't valid</h1>
    <p>This confirmation link has expired or was already used. Request beta access again from the homepage.</p>
</main>
{% endblock %}
```

- [ ] **Step 4: Create the controller**

`src/Controller/BetaConfirmController.php`:
```php
<?php

namespace App\Controller;

use App\Repository\BetaRequestRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class BetaConfirmController extends AbstractController
{
    public function __construct(
        private readonly BetaRequestRepository $betaRequests,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/beta/confirm/{token}', name: 'beta_confirm', methods: ['GET'])]
    public function __invoke(string $token): Response
    {
        $betaRequest = $this->betaRequests->findOneByToken($token);

        if ($betaRequest === null) {
            return $this->render('beta/invalid.html.twig', [], new Response('', 404));
        }

        if ($betaRequest->getStatus()->value !== 'confirmed') {
            $betaRequest->confirm();
            $this->em->flush();
        }

        return $this->render('beta/confirmed.html.twig');
    }
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `lando php bin/phpunit tests/Controller/BetaConfirmControllerTest.php`
Expected: PASS (2 tests)

- [ ] **Step 6: Now go back and finish Task 6's Step 4** (run `BetaRequestsControllerTest`, expect PASS)

- [ ] **Step 7: Commit**

```bash
git add src/Controller/BetaConfirmController.php templates/beta/ tests/Controller/BetaConfirmControllerTest.php
git commit -m "feat: add GET /beta/confirm/{token} double opt-in confirmation"
```

---

### Task 8: Admin HTTP Basic Auth

**Files:**
- Modify: `config/packages/security.yaml`
- Modify: `.env` (add `ADMIN_USER`, `ADMIN_PASSWORD_HASH` placeholders)
- Test: `tests/Controller/Admin/AdminAuthTest.php`

**Interfaces:**
- Consumes: nothing new.
- Produces: any route under `/admin` requires HTTP Basic Auth against an in-memory user built from `ADMIN_USER`/`ADMIN_PASSWORD_HASH`. Task 9 (admin CRUD) builds its controllers under `/admin` and relies on this firewall already being in place.

- [ ] **Step 1: Add env placeholders**

Append to `.env`:
```
ADMIN_USER=admin
# Generate with: lando symfony -- security:hash-password
ADMIN_PASSWORD_HASH=CHANGE_ME_IN_ENV_LOCAL
```

Generate a real local hash and put it in `.env.local` (gitignored):
```bash
lando symfony -- security:hash-password
```

- [ ] **Step 2: Write the failing functional test**

`tests/Controller/Admin/AdminAuthTest.php`:
```php
<?php

namespace App\Tests\Controller\Admin;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class AdminAuthTest extends WebTestCase
{
    public function testAdminRouteRejectsWithoutCredentials(): void
    {
        $client = static::createClient();
        $client->request('GET', '/admin/items');
        $this->assertResponseStatusCodeSame(401);
    }
}
```

- [ ] **Step 2b: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Controller/Admin/AdminAuthTest.php`
Expected: FAIL — no `/admin/items` route yet returns 404 instead of 401, or security isn't configured. Either way it won't be a clean 401.

- [ ] **Step 3: Configure the security firewall**

Add an in-memory user provider driven by env vars and an HTTP Basic firewall for `/admin` in `config/packages/security.yaml`. Under `security:`:

```yaml
security:
    password_hashers:
        Symfony\Component\Security\Core\User\InMemoryUser: 'auto'

    providers:
        admin_provider:
            memory:
                users:
                    '%env(ADMIN_USER)%':
                        password: '%env(ADMIN_PASSWORD_HASH)%'
                        roles: ['ROLE_ADMIN']

    firewalls:
        admin:
            pattern: ^/admin
            provider: admin_provider
            http_basic:
                realm: 'Take My Holiday Admin'
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false
        main:
            lazy: true
            provider: admin_provider

    access_control:
        - { path: ^/admin, roles: ROLE_ADMIN }
```

Note: the `memory` provider does not support `%env()%` as a map key directly in all Symfony versions — if `make:user`/config validation rejects this, replace it with a small `AdminUserProvider implements UserProviderInterface` service that reads `ADMIN_USER`/`ADMIN_PASSWORD_HASH` from `%env()%` parameters injected via constructor and returns a single `InMemoryUser`. Register it as `App\Security\AdminUserProvider` and reference it as the `admin_provider`.

- [ ] **Step 4: Add a placeholder `/admin/items` route so the auth test has something to hit**

This is superseded by Task 9's real controller — if doing tasks in order, skip this step and let Task 9 supply the route, then return here to run Step 5.

- [ ] **Step 5: Run the test to confirm it passes** (after Task 9's controller exists)

Run: `lando php bin/phpunit tests/Controller/Admin/AdminAuthTest.php`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add config/packages/security.yaml .env
git commit -m "feat: gate /admin behind HTTP Basic Auth via env-configured credentials"
```

---

### Task 9: Admin CRUD for `PackingItem`

**Files:**
- Create: `src/Form/PackingItemFormType.php`
- Create: `src/Controller/Admin/PackingItemAdminController.php`
- Create: `templates/admin/items/index.html.twig`
- Create: `templates/admin/items/form.html.twig`
- Test: `tests/Controller/Admin/PackingItemAdminControllerTest.php`

**Interfaces:**
- Consumes: `PackingItem`, `PackingItemType`, `PackingItemClimate`, `PackingItemRepository` (Task 2); the `/admin` firewall (Task 8).
- Produces: routes `admin_items_index` (`GET /admin/items`), `admin_items_new` (`GET|POST /admin/items/new`), `admin_items_edit` (`GET|POST /admin/items/{id}/edit`), `admin_items_delete` (`POST /admin/items/{id}/delete`). Satisfies Task 8's dependency on a real `/admin/items` route.

- [ ] **Step 1: Write the failing functional test**

`tests/Controller/Admin/PackingItemAdminControllerTest.php`:
```php
<?php

namespace App\Tests\Controller\Admin;

use App\Entity\PackingItem;
use App\Entity\PackingItemClimate;
use App\Entity\PackingItemType;
use App\Repository\PackingItemRepository;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class PackingItemAdminControllerTest extends WebTestCase
{
    private function authClient()
    {
        $client = static::createClient();
        $client->setServerParameters([
            'PHP_AUTH_USER' => $_ENV['ADMIN_USER'] ?? 'admin',
            'PHP_AUTH_PW' => 'test-admin-password',
        ]);
        return $client;
    }

    public function testCreateEditDeleteFlow(): void
    {
        $client = $this->authClient();

        $client->request('GET', '/admin/items/new');
        $this->assertResponseIsSuccessful();

        $client->submitForm('Save', [
            'packing_item[name]' => 'Test Umbrella',
            'packing_item[type]' => PackingItemType::Essentials->value,
            'packing_item[weightGrams]' => '300',
            'packing_item[climate]' => PackingItemClimate::Any->value,
        ]);
        $this->assertResponseRedirects('/admin/items');

        /** @var PackingItemRepository $repo */
        $repo = static::getContainer()->get(PackingItemRepository::class);
        $item = $repo->findOneBy(['name' => 'Test Umbrella']);
        $this->assertNotNull($item);

        $client->request('POST', "/admin/items/{$item->getId()}/delete");
        $this->assertResponseRedirects('/admin/items');
        $this->assertNull($repo->find($item->getId()));
    }
}
```

Test-only auth: add `ADMIN_PASSWORD_HASH` for `test-admin-password` to `.env.test` (generate via `lando symfony -- security:hash-password -- test-admin-password`) so functional tests have deterministic credentials.

- [ ] **Step 2: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Controller/Admin/PackingItemAdminControllerTest.php`
Expected: FAIL — route not found.

- [ ] **Step 3: Create the form type**

`src/Form/PackingItemFormType.php`:
```php
<?php

namespace App\Form;

use App\Entity\PackingItem;
use App\Entity\PackingItemClimate;
use App\Entity\PackingItemType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\EnumType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class PackingItemFormType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('name', TextType::class)
            ->add('type', EnumType::class, ['class' => PackingItemType::class])
            ->add('weightGrams', IntegerType::class)
            ->add('climate', EnumType::class, ['class' => PackingItemClimate::class])
            ->add('save', SubmitType::class, ['label' => 'Save']);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults(['data_class' => PackingItem::class]);
    }
}
```

- [ ] **Step 4: Create the controller**

`src/Controller/Admin/PackingItemAdminController.php`:
```php
<?php

namespace App\Controller\Admin;

use App\Entity\PackingItem;
use App\Entity\PackingItemClimate;
use App\Entity\PackingItemType;
use App\Form\PackingItemFormType;
use App\Repository\PackingItemRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/admin/items')]
class PackingItemAdminController extends AbstractController
{
    public function __construct(
        private readonly PackingItemRepository $items,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('', name: 'admin_items_index', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('admin/items/index.html.twig', [
            'items' => $this->items->findBy([], ['name' => 'ASC']),
        ]);
    }

    #[Route('/new', name: 'admin_items_new', methods: ['GET', 'POST'])]
    public function new(Request $request): Response
    {
        $item = new PackingItem('', PackingItemType::Essentials, 0, PackingItemClimate::Any);
        $form = $this->createForm(PackingItemFormType::class, $item);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->em->persist($item);
            $this->em->flush();
            return $this->redirectToRoute('admin_items_index');
        }

        return $this->render('admin/items/form.html.twig', ['form' => $form]);
    }

    #[Route('/{id}/edit', name: 'admin_items_edit', methods: ['GET', 'POST'])]
    public function edit(Request $request, int $id): Response
    {
        $item = $this->items->find($id) ?? throw $this->createNotFoundException();
        $form = $this->createForm(PackingItemFormType::class, $item);
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $this->em->flush();
            return $this->redirectToRoute('admin_items_index');
        }

        return $this->render('admin/items/form.html.twig', ['form' => $form]);
    }

    #[Route('/{id}/delete', name: 'admin_items_delete', methods: ['POST'])]
    public function delete(int $id): RedirectResponse
    {
        $item = $this->items->find($id) ?? throw $this->createNotFoundException();
        $this->em->remove($item);
        $this->em->flush();
        return $this->redirectToRoute('admin_items_index');
    }
}
```

- [ ] **Step 5: Create the templates**

`templates/admin/items/index.html.twig`:
```twig
{% extends 'base.html.twig' %}
{% block title %}Packing Items{% endblock %}
{% block body %}
<main>
    <h1>Packing Items</h1>
    <a href="{{ path('admin_items_new') }}">New item</a>
    <table>
        <thead><tr><th>Name</th><th>Type</th><th>Weight (g)</th><th>Climate</th><th>Active</th><th></th></tr></thead>
        <tbody>
        {% for item in items %}
            <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.type.value }}</td>
                <td>{{ item.weightGrams }}</td>
                <td>{{ item.climate.value }}</td>
                <td>{{ item.active ? 'Yes' : 'No' }}</td>
                <td>
                    <a href="{{ path('admin_items_edit', {id: item.id}) }}">Edit</a>
                    <form method="post" action="{{ path('admin_items_delete', {id: item.id}) }}" style="display:inline">
                        <button type="submit">Delete</button>
                    </form>
                </td>
            </tr>
        {% endfor %}
        </tbody>
    </table>
</main>
{% endblock %}
```

`templates/admin/items/form.html.twig`:
```twig
{% extends 'base.html.twig' %}
{% block title %}Packing Item{% endblock %}
{% block body %}
<main>
    {{ form_start(form) }}
        {{ form_widget(form) }}
    {{ form_end(form) }}
</main>
{% endblock %}
```

- [ ] **Step 6: Run the test to confirm it passes**

Run: `lando php bin/phpunit tests/Controller/Admin/PackingItemAdminControllerTest.php`
Expected: PASS

- [ ] **Step 7: Go back and run Task 8's `AdminAuthTest`**

Run: `lando php bin/phpunit tests/Controller/Admin/AdminAuthTest.php`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/Form/PackingItemFormType.php src/Controller/Admin/PackingItemAdminController.php templates/admin/ tests/Controller/Admin/PackingItemAdminControllerTest.php
git commit -m "feat: add admin CRUD screens for packing items"
```

---

### Task 10: `app:seed-items` command with fixture flattened from the mobile app's catalog

**Files:**
- Create: `resources/seed/packing-items.json`
- Create: `src/Command/SeedItemsCommand.php`
- Test: `tests/Command/SeedItemsCommandTest.php`

**Interfaces:**
- Consumes: `PackingItem`, `PackingItemRepository` (Task 2).
- Produces: `php bin/console app:seed-items`, idempotent (upsert by `name`). Nothing else depends on this beyond the deploy pipeline (Task 13).

- [ ] **Step 1: Build the seed fixture from the mobile app's TS catalog**

In the `packmyholiday` (mobile app) repo, read `src/data/itemCatalog.ts`, `src/data/infantEssentials.ts`, `src/data/toddlerEssentials.ts`, and `src/data/babyFamilyGear.ts`. For each `CatalogEntry`-shaped item, produce one JSON row:
- `name` = entry's `name`
- `type` = entry's `category`
- `weightGrams` = entry's `baseWeightGrams`
- `climate` = `cold` if its `appliesWhen` checks `climate === 'cold'`, `warm` if it checks `'warm'`, `temperate` if it checks `'temperate'`, else `any`

Write the result to `resources/seed/packing-items.json` in the **new** `packmyholiday-backend` repo as an array like:
```json
[
  { "name": "T-Shirt / Top", "type": "clothing", "weightGrams": 180, "climate": "any" },
  { "name": "Jacket", "type": "clothing", "weightGrams": 700, "climate": "cold" }
]
```
This is a manual, one-time transcription (per the design doc) — go through each catalog file's entries and list them all; do not skip any.

- [ ] **Step 2: Write the failing test**

`tests/Command/SeedItemsCommandTest.php`:
```php
<?php

namespace App\Tests\Command;

use App\Repository\PackingItemRepository;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Tester\CommandTester;

class SeedItemsCommandTest extends KernelTestCase
{
    public function testSeedIsIdempotent(): void
    {
        self::bootKernel();
        $application = new Application(self::$kernel);
        $command = $application->find('app:seed-items');
        $tester = new CommandTester($command);

        $tester->execute([]);
        $tester->execute([]); // run twice — must not duplicate rows

        $this->assertSame(0, $tester->getStatusCode());

        /** @var PackingItemRepository $repo */
        $repo = static::getContainer()->get(PackingItemRepository::class);
        $items = $repo->findBy(['name' => 'T-Shirt / Top']);
        $this->assertCount(1, $items);
    }
}
```

- [ ] **Step 2b: Run it to confirm it fails**

Run: `lando php bin/phpunit tests/Command/SeedItemsCommandTest.php`
Expected: FAIL — command `app:seed-items` not found.

- [ ] **Step 3: Create the command**

`src/Command/SeedItemsCommand.php`:
```php
<?php

namespace App\Command;

use App\Entity\PackingItem;
use App\Entity\PackingItemClimate;
use App\Entity\PackingItemType;
use App\Repository\PackingItemRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(name: 'app:seed-items', description: 'Seed or update PackingItem rows from resources/seed/packing-items.json')]
class SeedItemsCommand extends Command
{
    public function __construct(
        private readonly PackingItemRepository $items,
        private readonly EntityManagerInterface $em,
        private readonly string $projectDir,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $path = $this->projectDir . '/resources/seed/packing-items.json';
        $rows = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);

        $created = 0;
        $updated = 0;

        foreach ($rows as $row) {
            $type = PackingItemType::from($row['type']);
            $climate = PackingItemClimate::from($row['climate']);
            $existing = $this->items->findOneBy(['name' => $row['name']]);

            if ($existing !== null) {
                $existing->setType($type)->setWeightGrams($row['weightGrams'])->setClimate($climate);
                $updated++;
                continue;
            }

            $this->em->persist(new PackingItem($row['name'], $type, $row['weightGrams'], $climate));
            $created++;
        }

        $this->em->flush();
        $io->success("Seeded items: {$created} created, {$updated} updated.");

        return Command::SUCCESS;
    }
}
```

`$projectDir` is autowired by Symfony's `kernel.project_dir` parameter binding by default in the skeleton — if it isn't picked up automatically, add to `config/services.yaml`:
```yaml
    App\Command\SeedItemsCommand:
        arguments:
            $projectDir: '%kernel.project_dir%'
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `lando php bin/phpunit tests/Command/SeedItemsCommandTest.php`
Expected: PASS

- [ ] **Step 5: Run it against the real dev DB and spot-check**

```bash
lando symfony -- app:seed-items
lando psql -c "SELECT count(*) FROM packing_item;"
```

- [ ] **Step 6: Commit**

```bash
git add resources/seed/packing-items.json src/Command/SeedItemsCommand.php tests/Command/SeedItemsCommandTest.php config/services.yaml
git commit -m "feat: add idempotent app:seed-items command with mobile-app-derived fixture"
```

---

### Task 11: Public site — home page, privacy policy, contact form

**Files:**
- Create: `templates/site/home.html.twig`
- Create: `templates/site/_privacy_policy.html.twig`
- Create: `src/Controller/SiteController.php`
- Create: `src/Controller/ContactController.php`
- Create: `assets/controllers/beta_form_controller.js` (Stimulus)
- Test: `tests/Controller/SiteControllerTest.php`
- Test: `tests/Controller/ContactControllerTest.php`

**Interfaces:**
- Consumes: `AppMailer::sendContactNotification` (Task 5), route `beta_requests_create` (Task 6, called via fetch from the Stimulus controller).
- Produces: routes `site_home` (`GET /`), `contact_create` (`POST /contact`). Nothing downstream depends on these.

- [ ] **Step 1: Write the failing tests**

`tests/Controller/SiteControllerTest.php`:
```php
<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class SiteControllerTest extends WebTestCase
{
    public function testHomePageRendersWithPrivacyPolicyAndForms(): void
    {
        $client = static::createClient();
        $client->request('GET', '/');

        $this->assertResponseIsSuccessful();
        $this->assertSelectorExists('#privacy-policy');
        $this->assertSelectorExists('form[action="/contact"]');
        $this->assertSelectorExists('[data-controller="beta-form"]');
    }
}
```

`tests/Controller/ContactControllerTest.php`:
```php
<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\MailerAssertionsTrait;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class ContactControllerTest extends WebTestCase
{
    use MailerAssertionsTrait;

    public function testValidSubmissionSendsEmailAndRedirects(): void
    {
        $client = static::createClient();

        $client->request('POST', '/contact', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'message' => 'Interested in a demo.',
        ]);

        $this->assertResponseRedirects('/');
        $this->assertEmailCount(1);
    }

    public function testMissingFieldsReturns422(): void
    {
        $client = static::createClient();

        $client->request('POST', '/contact', ['name' => '', 'email' => '', 'message' => '']);

        $this->assertResponseStatusCodeSame(422);
    }
}
```

- [ ] **Step 2: Run them to confirm they fail**

Run: `lando php bin/phpunit tests/Controller/SiteControllerTest.php tests/Controller/ContactControllerTest.php`
Expected: FAIL — routes not found.

- [ ] **Step 3: Create the privacy policy partial**

`templates/site/_privacy_policy.html.twig`:
```twig
<section id="privacy-policy">
    <h2>Privacy Policy</h2>
    <p>Last updated: {{ "now"|date("F j, Y") }}</p>
    <p>Take My Holiday collects only the trip details you enter (dates, destination, travelers) to generate packing lists. This data is stored locally on your device and is not transmitted to our servers except where you explicitly submit it (e.g. a beta access request, which stores only your email address).</p>
    <p>We do not sell or share your data with third parties. Contact us at the address below with any privacy questions.</p>
</section>
```

- [ ] **Step 4: Create the home template**

`templates/site/home.html.twig`:
```twig
{% extends 'base.html.twig' %}
{% block title %}Take My Holiday{% endblock %}
{% block body %}
<header class="hero" style="--logo-url: url('{{ asset('logo.svg') }}')">
    <div class="logo-slot"></div>
    <h1>Take My Holiday</h1>
    <p>Smart packing lists that adapt to your trip's dates, destination, and climate.</p>
</header>

<section id="features">
    <h2>Features</h2>
    <ul>
        <li>Auto-generated packing lists based on trip length and climate</li>
        <li>Per-traveler lists for adults, children, toddlers, and infants</li>
        <li>Editable, checkable items you can pack right from your phone</li>
    </ul>
</section>

{% include 'site/_privacy_policy.html.twig' %}

<section id="contact">
    <h2>Contact Us</h2>
    <form method="post" action="{{ path('contact_create') }}">
        <label>Name <input type="text" name="name" required></label>
        <label>Email <input type="email" name="email" required></label>
        <label>Message <textarea name="message" required></textarea></label>
        <button type="submit">Send</button>
    </form>
</section>

<section id="beta" data-controller="beta-form">
    <h2>Request Beta Access</h2>
    <form data-action="beta-form#submit">
        <label>Email <input type="email" data-beta-form-target="email" required></label>
        <button type="submit">Request access</button>
    </form>
    <p data-beta-form-target="status"></p>
</section>
{% endblock %}
```

- [ ] **Step 5: Create the Stimulus controller**

`assets/controllers/beta_form_controller.js`:
```javascript
import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['email', 'status'];

    async submit(event) {
        event.preventDefault();
        this.statusTarget.textContent = 'Sending...';

        const response = await fetch('/api/v1/beta-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: this.emailTarget.value }),
        });

        this.statusTarget.textContent = response.ok
            ? 'Check your email to confirm beta access.'
            : 'Something went wrong — please try again.';
    }
}
```

Register it in `assets/controllers.json` (AssetMapper/Stimulus convention — add an entry for `beta-form` pointing at `controllers/beta_form_controller.js`, `enabled: true`, matching the format of any existing entries the skeleton generated).

- [ ] **Step 6: Create `SiteController`**

`src/Controller/SiteController.php`:
```php
<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class SiteController extends AbstractController
{
    #[Route('/', name: 'site_home', methods: ['GET'])]
    public function home(): Response
    {
        return $this->render('site/home.html.twig');
    }
}
```

- [ ] **Step 7: Create `ContactController`**

`src/Controller/ContactController.php`:
```php
<?php

namespace App\Controller;

use App\Service\AppMailer;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class ContactController extends AbstractController
{
    public function __construct(private readonly AppMailer $mailer) {}

    #[Route('/contact', name: 'contact_create', methods: ['POST'])]
    public function create(Request $request): Response
    {
        $name = trim((string) $request->request->get('name', ''));
        $email = trim((string) $request->request->get('email', ''));
        $message = trim((string) $request->request->get('message', ''));

        if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return new Response('Invalid contact form submission.', 422);
        }

        $this->mailer->sendContactNotification($name, $email, $message);

        return new RedirectResponse($this->generateUrl('site_home'));
    }
}
```

- [ ] **Step 8: Run the tests to confirm they pass**

Run: `lando php bin/phpunit tests/Controller/SiteControllerTest.php tests/Controller/ContactControllerTest.php`
Expected: PASS (3 tests)

- [ ] **Step 9: Commit**

```bash
git add templates/site/ src/Controller/SiteController.php src/Controller/ContactController.php assets/controllers/beta_form_controller.js assets/controllers.json tests/Controller/SiteControllerTest.php tests/Controller/ContactControllerTest.php
git commit -m "feat: add public site home page with privacy policy, contact form, and beta request form"
```

---

### Task 12: Logo placeholder styling and base layout

**Files:**
- Modify: `templates/base.html.twig`
- Create: `assets/styles/app.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: a `.logo-slot` CSS hook so a real logo image can be dropped in later via a one-line `background-image` change, without touching `home.html.twig`. No other task depends on this.

- [ ] **Step 1: Create the stylesheet**

`assets/styles/app.css`:
```css
:root {
    --logo-url: none;
}

.hero {
    text-align: center;
    padding: 3rem 1rem;
}

.logo-slot {
    width: 120px;
    height: 120px;
    margin: 0 auto 1rem;
    background-image: var(--logo-url);
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

main, section {
    max-width: 720px;
    margin: 0 auto;
    padding: 1rem;
}

.confirm-page {
    text-align: center;
    padding: 4rem 1rem;
}
```

- [ ] **Step 2: Link it in the base template**

In `templates/base.html.twig`, inside `{% block stylesheets %}`, add:
```twig
{{ importmap('app') }}
<link rel="stylesheet" href="{{ asset('styles/app.css') }}">
```

(Confirm the exact AssetMapper wiring matches what `symfony new --webapp` generated — if `importmap()` already loads CSS via `assets/app.js` imports, add `import '../styles/app.css';` there instead of a manual `<link>` tag.)

- [ ] **Step 3: Verify visually**

Run: `lando start` then open `http://localhost:52200/` in a browser.
Expected: home page renders with an empty (invisible, since `--logo-url: none`) logo slot above the "Take My Holiday" heading — confirms the CSS hook works without a real logo asset yet.

- [ ] **Step 4: Commit**

```bash
git add assets/styles/app.css templates/base.html.twig
git commit -m "style: add base layout styling with a swappable logo slot"
```

---

### Task 13: Docker image, Compose files, and GitHub Actions deploy to Hetzner

**Files:**
- Create: `Dockerfile`
- Create: `docker/nginx.conf`
- Create: `docker/nginx-http-only.conf`
- Create: `docker/supervisord.conf`
- Create: `docker-compose.prod.yml`
- Create: `.dockerignore`
- Create: `.github/workflows/deploy-prod.yml`

**Interfaces:**
- Consumes: nothing new (this is the deploy wrapper around everything built in Tasks 1-12).
- Produces: a pushable/deployable image; nothing else in this plan depends on it.

- [ ] **Step 1: Copy and adapt the Docker/nginx/supervisor files from `wunderkind-backend`**

Copy these files verbatim from `/Users/courtneyadesile/Documents/WunderkindFactory/wunderkind-backend/docker/` into this repo's `docker/` directory as a starting point:
- `nginx.conf`
- `nginx-http-only.conf`
- `supervisord.conf`

Do not copy `jwt-entrypoint.sh`, `pool-warm.sh`, `worldpack-warm.sh`, `leaderboards-generate.sh` — none apply here.

- [ ] **Step 2: Write the `Dockerfile`**

```dockerfile
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    nginx \
    postgresql-dev \
    libpq \
    icu-dev \
    oniguruma-dev \
    supervisor \
    su-exec \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        intl \
        opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx-http-only.conf /etc/nginx/nginx-http-only.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN mkdir -p var/cache var/log && chown -R www-data:www-data var/

EXPOSE 80 443

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

(No `ENTRYPOINT` script is needed since there's no JWT key generation step, unlike `wunderkind-backend`.)

- [ ] **Step 3: Write `.dockerignore`**

```
var/
vendor/
node_modules/
.git/
.lando.yml
tests/
```

- [ ] **Step 4: Write `docker-compose.prod.yml`**

```yaml
services:
  app:
    image: ghcr.io/cadesile/packmyholiday-backend:prod
    container_name: packmyholiday-prod
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    ports:
      - "80:80"
      - "443:443"
    environment:
      APP_ENV: prod
      APP_SECRET: ${APP_SECRET}
      DATABASE_URL: postgresql://packmyholiday:${DB_PASSWORD}@postgres-prod:5432/packmyholiday?serverVersion=16&charset=utf8
      MAILER_DSN: ${MAILER_DSN}
      MAILER_FROM: ${MAILER_FROM}
      MAILER_FROM_NAME: ${MAILER_FROM_NAME}
      ADMIN_USER: ${ADMIN_USER}
      ADMIN_PASSWORD_HASH: ${ADMIN_PASSWORD_HASH}
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      postgres-prod:
        condition: service_healthy

  postgres-prod:
    image: postgres:16-alpine
    container_name: postgres-prod
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    environment:
      POSTGRES_USER: packmyholiday
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: packmyholiday
    volumes:
      - /mnt/volume-wkf/packmyholiday/prod/pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U packmyholiday"]
      interval: 10s
      timeout: 5s
      retries: 5

  certbot:
    image: certbot/certbot
    container_name: certbot-prod
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/www/certbot:/var/www/certbot
    entrypoint: >
      /bin/sh -c "trap exit TERM;
      while :; do
        certbot renew --webroot -w /var/www/certbot --quiet;
        sleep 12h & wait $${!};
      done"
```

Adjust the `/mnt/volume-wkf/packmyholiday/prod/pgdata` host path and the `ghcr.io/cadesile/...` image name to match whatever Hetzner volume path and GitHub org/user this actually deploys under — confirm with whoever provisions the Hetzner box before first deploy.

- [ ] **Step 5: Write the GitHub Actions workflow**

`.github/workflows/deploy-prod.yml`:
```yaml
name: Deploy Production

on:
  push:
    branches:
      - main

permissions:
  contents: read
  packages: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/cadesile/packmyholiday-backend:prod

      - name: Copy compose file to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.HETZNER_IP }}
          username: deploy
          key: ${{ secrets.HETZNER_SSH_KEY }}
          source: docker-compose.prod.yml
          target: /mnt/volume-wkf/packmyholiday/prod/

      - name: Deploy to Hetzner
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.HETZNER_IP }}
          username: deploy
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            set -e
            cd /mnt/volume-wkf/packmyholiday/prod

            cat > .env <<EOF
            DB_PASSWORD=${{ secrets.PROD_DB_PASSWORD }}
            APP_SECRET=${{ secrets.PROD_APP_SECRET }}
            MAILER_DSN="${{ secrets.PROD_MAILER_DSN }}"
            MAILER_FROM="${{ secrets.PROD_MAILER_FROM }}"
            MAILER_FROM_NAME="${{ secrets.PROD_MAILER_FROM_NAME }}"
            ADMIN_USER="${{ secrets.PROD_ADMIN_USER }}"
            ADMIN_PASSWORD_HASH="${{ secrets.PROD_ADMIN_PASSWORD_HASH }}"
            EOF
            sed -i 's/^[[:space:]]*//' .env

            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml up -d
            docker compose -f docker-compose.prod.yml exec -T app \
              php bin/console doctrine:migrations:migrate --no-interaction
            docker compose -f docker-compose.prod.yml exec -T app \
              php bin/console app:seed-items
            docker compose -f docker-compose.prod.yml exec -T app \
              php bin/console cache:clear
            docker image prune -a -f --filter "until=24h"
```

This requires the following GitHub Actions secrets to be set on the repo before first run: `HETZNER_IP`, `HETZNER_SSH_KEY`, `PROD_DB_PASSWORD`, `PROD_APP_SECRET`, `PROD_MAILER_DSN`, `PROD_MAILER_FROM`, `PROD_MAILER_FROM_NAME`, `PROD_ADMIN_USER`, `PROD_ADMIN_PASSWORD_HASH`. Setting these up is an out-of-band manual step (repo settings), not something this plan's tasks can automate.

- [ ] **Step 6: Verify the image builds locally**

Run: `docker build -t packmyholiday-backend:local .`
Expected: build completes without errors.

- [ ] **Step 7: Commit**

```bash
git add Dockerfile docker/ docker-compose.prod.yml .dockerignore .github/workflows/deploy-prod.yml
git commit -m "chore: add Docker image, prod compose, and Hetzner deploy workflow"
```

---

### Task 14: Full test suite and README wrap-up

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: everything from Tasks 1-13.
- Produces: nothing further downstream — this is the final verification task.

- [ ] **Step 1: Run the entire test suite**

Run: `lando php bin/phpunit`
Expected: all tests from Tasks 2-11 pass (PackingItem, BetaRequest, ItemsController, AppMailer, BetaRequestsController, BetaConfirmController, AdminAuth, PackingItemAdminController, SeedItemsCommand, SiteController, ContactController).

- [ ] **Step 2: Expand `README.md` with the full setup/deploy story**

```markdown
# packmyholiday-backend

Symfony backend for the Take My Holiday app: public site (privacy policy,
contact/beta forms) + `/admin` packing-item management + versioned
`/api/v1` content API consumed by the mobile app.

## Local dev

    lando start
    lando composer install
    lando symfony -- doctrine:migrations:migrate
    lando symfony -- app:seed-items

Site: http://localhost:52200
Admin: http://localhost:52200/admin/items (HTTP Basic — set ADMIN_USER /
generate ADMIN_PASSWORD_HASH via `lando symfony -- security:hash-password`,
put both in `.env.local`)

## Tests

    lando php bin/phpunit

## Deploy

Push to `main` triggers `.github/workflows/deploy-prod.yml`, which builds
the Docker image, pushes to GHCR, and deploys to the Hetzner host via SSH.
Requires the GitHub Actions secrets listed in that workflow file to be
configured on the repo first.

## API

`GET /api/v1/items?type=&climate=` — public, returns active packing items.
`POST /api/v1/beta-requests` — `{ "email": "..." }`, triggers a double
opt-in confirmation email.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: expand README with setup, admin, testing, and deploy instructions"
```

---

## Task Order Note

Tasks 6 and 7 have a circular route dependency (Task 6's mailer link needs Task 7's `beta_confirm` route to exist to fully test, though the controller code itself compiles fine standing alone). Execute in this order: 1, 2, 3, 4, 5, 6 (steps 1-3 only), 7 (all steps), 6 (steps 4-5), 8 (steps 1-3), 9 (all steps), 8 (steps 4-6), 10, 11, 12, 13, 14.
