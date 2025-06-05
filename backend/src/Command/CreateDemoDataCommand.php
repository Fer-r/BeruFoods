<?php

namespace App\Command;

use App\Entity\Article;
use App\Entity\FoodType;
use App\Entity\Restaurant;
use App\Entity\RestaurantAddress;
use App\Entity\User;
use App\Entity\UserAddress;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-demo-data',
    description: 'Creates demo data: admin user, 20 users, 20 restaurants with 5 products each',
)]
class CreateDemoDataCommand extends Command
{
    private const GRANADA_LOCATIONS = [
        ['lat' => 37.1773363, 'lng' => -3.5985571, 'address' => 'Plaza Nueva, 1, Granada'],
        ['lat' => 37.1760826, 'lng' => -3.5881388, 'address' => 'Calle Real de la Alhambra, s/n, Granada'],
        ['lat' => 37.1834447, 'lng' => -3.6035473, 'address' => 'Plaza de las Pasiegas, 1, Granada'],
        ['lat' => 37.1969493, 'lng' => -3.624167, 'address' => 'Avenida de la Ciencia, s/n, Granada'],
        ['lat' => 37.1789142, 'lng' => -3.6066264, 'address' => 'Campo del Príncipe, 18, Granada'],
        ['lat' => 37.1826701, 'lng' => -3.5969644, 'address' => 'Plaza de San Nicolás, 2, Granada'],
        ['lat' => 37.1741979, 'lng' => -3.5985571, 'address' => 'Camino del Sacromonte, 89, Granada'],
        ['lat' => 37.1618037, 'lng' => -3.5859244, 'address' => 'Paseo del Genil, 25, Granada'],
        ['lat' => 37.1924509, 'lng' => -3.6145272, 'address' => 'Avenida de la Constitución, 18, Granada'],
        ['lat' => 37.1618037, 'lng' => -3.6145272, 'address' => 'Calle Recogidas, 35, Granada'],
    ];

    private const MADRID_LOCATIONS = [
        ['lat' => 40.4167754, 'lng' => -3.7037902, 'address' => 'Puerta del Sol, 1, Madrid'],
        ['lat' => 40.4152606, 'lng' => -3.6866267, 'address' => 'Calle de Alfonso XII, 28, Madrid'],
        ['lat' => 40.4253735, 'lng' => -3.6844611, 'address' => 'Calle de Serrano, 45, Madrid'],
        ['lat' => 40.4233142, 'lng' => -3.7121255, 'address' => 'Gran Vía, 32, Madrid'],
        ['lat' => 40.4380638, 'lng' => -3.6795487, 'address' => 'Paseo de la Castellana, 89, Madrid'],
        ['lat' => 40.4123932, 'lng' => -3.7136765, 'address' => 'Plaza de la Cebada, 15, Madrid'],
        ['lat' => 40.4332199, 'lng' => -3.7016493, 'address' => 'Calle de Fuencarral, 78, Madrid'],
        ['lat' => 40.4400356, 'lng' => -3.6921335, 'address' => 'Paseo de la Castellana, 67, Madrid'],
        ['lat' => 40.4079946, 'lng' => -3.6924553, 'address' => 'Plaza del Emperador Carlos V, 1, Madrid'],
        ['lat' => 40.4469715, 'lng' => -3.6919832, 'address' => 'Plaza de Castilla, 3, Madrid'],
    ];

    private const RESTAURANT_NAMES = [
        'Delicious Bites', 'Tasty Corner', 'Flavor Fusion', 'Gourmet Haven', 'Spice Route',
        'Urban Plate', 'Fresh & Tasty', 'Culinary Delight', 'Savory Sensations', 'Epicurean Edge',
        'Gastronomic Gems', 'Palate Paradise', 'Cuisine Castle', 'Dining Dynasty', 'Feast Factory',
        'Meal Mansion', 'Nibble Nook', 'Relish Retreat', 'Savor Spot', 'Taste Temple'
    ];

    private const ARTICLE_NAMES = [
        'Margherita Pizza', 'Chicken Alfredo', 'Beef Burger', 'Caesar Salad', 'Sushi Platter',
        'Pad Thai', 'Butter Chicken', 'Paella', 'Greek Salad', 'BBQ Ribs',
        'Vegetable Stir Fry', 'Fish and Chips', 'Mushroom Risotto', 'Beef Tacos', 'Falafel Wrap',
        'Chicken Tikka', 'Vegetable Lasagna', 'Shrimp Scampi', 'Beef Stroganoff', 'Veggie Burger',
        'Chicken Wings', 'Lamb Kebab', 'Seafood Pasta', 'Tofu Curry', 'Beef Enchiladas'
    ];

    private const ARTICLE_DESCRIPTIONS = [
        'A delicious classic with tomato sauce, mozzarella, and basil.',
        'Creamy pasta with grilled chicken and parmesan cheese.',
        'Juicy beef patty with lettuce, tomato, and special sauce.',
        'Fresh romaine lettuce with croutons, parmesan, and Caesar dressing.',
        'Assorted fresh sushi with wasabi and soy sauce.',
        'Thai noodles with vegetables, egg, and peanuts.',
        'Tender chicken in a rich, creamy tomato sauce.',
        'Traditional Spanish rice dish with seafood and saffron.',
        'Fresh vegetables, feta cheese, olives, and olive oil dressing.',
        'Slow-cooked ribs with tangy BBQ sauce.',
        'Mixed vegetables stir-fried in a savory sauce.',
        'Crispy battered fish with thick-cut fries.',
        'Creamy Italian rice dish with mushrooms and parmesan.',
        'Seasoned ground beef in soft tortillas with toppings.',
        'Crispy falafel with vegetables and tahini in a wrap.',
        'Marinated chicken pieces cooked in a tandoor oven.',
        'Layers of pasta, vegetables, and cheese in tomato sauce.',
        'Succulent shrimp in a garlic butter sauce.',
        'Tender beef strips in a creamy mushroom sauce.',
        'Plant-based patty with all the classic burger toppings.'
    ];

    private const ALLERGIES = [
        'Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish', 'Fish', 'Wheat', 'Peanuts', 'Sesame'
    ];

    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $io->title('Creating Demo Data');

        // Get existing food types from database
        $io->section('Fetching Food Types');
        $foodTypes = $this->getFoodTypes($io);

        if (empty($foodTypes)) {
            $io->error('No food types found in the database. Please run migrations first.');
            return Command::FAILURE;
        }

        // Create admin user
        $io->section('Creating Admin User');
        $this->createAdminUser($io);

        // Create users
        $io->section('Creating Users');
        $this->createUsers($io);

        // Create restaurants with articles
        $io->section('Creating Restaurants with Articles');
        $this->createRestaurants($io, $foodTypes);

        $io->success('Demo data created successfully!');
        
        // Count existing entities
        $userCount = $this->entityManager->getRepository(User::class)->count([]);
        $restaurantCount = $this->entityManager->getRepository(Restaurant::class)->count([]);
        $articleCount = $this->entityManager->getRepository(Article::class)->count([]);
        
        $io->table(
            ['Entity', 'Total Count'],
            [
                ['Users (including admin)', $userCount],
                ['Restaurants', $restaurantCount],
                ['Articles', $articleCount],
                ['Food Types', count($foodTypes)],
            ]
        );

        $io->note('Demo account credentials:');
        $io->listing([
            'Admin: admin@berufoods.com / password123',
            'Demo users: user1@example.com to user20@example.com / password123',
            'Demo restaurants: restaurant1@example.com to restaurant20@example.com / password123'
        ]);

        return Command::SUCCESS;
    }

    private function getFoodTypes(SymfonyStyle $io): array
    {
        $foodTypes = $this->entityManager->getRepository(FoodType::class)->findAll();
        
        if (count($foodTypes) > 0) {
            $io->info(sprintf('Found %d existing food types', count($foodTypes)));
            return $foodTypes;
        }
        
        $io->warning('No food types found in the database. Please run migrations first.');
        return [];
    }

    private function createAdminUser(SymfonyStyle $io): void
    {
        $userRepository = $this->entityManager->getRepository(User::class);
        $adminEmail = 'admin@berufoods.com';
        
        // Check if admin already exists
        $existingAdmin = $userRepository->findOneBy(['email' => $adminEmail]);
        if ($existingAdmin) {
            $io->writeln('Admin user already exists, checking/updating roles...');
            
            // Ensure admin has correct roles
            if (!in_array('ROLE_ADMIN', $existingAdmin->getRoles())) {
                $existingAdmin->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
                $this->entityManager->flush();
                $io->writeln('Updated admin user roles');
            } else {
                $io->writeln('Admin user is properly configured');
            }
            return;
        }
        
        $admin = new User();
        $admin->setEmail($adminEmail);
        $admin->setName('BeruFoods Administrator');
        $admin->setPhone('600000000');
        
        // Set password
        $hashedPassword = $this->passwordHasher->hashPassword($admin, 'password123');
        $admin->setPassword($hashedPassword);
        $admin->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
        
        // Create admin address (in Madrid)
        $adminAddress = new UserAddress();
        $adminAddress->setLat('40.4167754');
        $adminAddress->setLng('-3.7037902');
        $adminAddress->setAddressLine(['Puerta del Sol, 1', 'Administration Office']);
        $adminAddress->setCity('Madrid');
        $adminAddress->setUser($admin);
        
        $this->entityManager->persist($adminAddress);
        $this->entityManager->persist($admin);
        $this->entityManager->flush();
        
        $io->writeln('Created admin user: ' . $adminEmail);
    }

    private function createUsers(SymfonyStyle $io): void
    {
        $userRepository = $this->entityManager->getRepository(User::class);
        $createdCount = 0;
        $skippedCount = 0;
        
        for ($i = 1; $i <= 20; $i++) {
            $email = sprintf('user%d@example.com', $i);
            
            // Skip if user already exists
            if ($userRepository->findOneBy(['email' => $email])) {
                $skippedCount++;
                continue;
            }
            
            $user = new User();
            $user->setEmail($email);
            $user->setName(sprintf('Demo User %d', $i));
            $user->setPhone(sprintf('6%d%d%d%d%d%d%d%d', 
                random_int(0, 9), random_int(0, 9), random_int(0, 9), 
                random_int(0, 9), random_int(0, 9), random_int(0, 9), 
                random_int(0, 9), random_int(0, 9)
            ));
            
            // Set password
            $hashedPassword = $this->passwordHasher->hashPassword($user, 'password123');
            $user->setPassword($hashedPassword);
            $user->setRoles(['ROLE_USER']);
            
            // Create address
            $userAddress = new UserAddress();
            
            // Half in Granada, half in Madrid
            if ($i <= 10) {
                $location = self::GRANADA_LOCATIONS[($i - 1) % count(self::GRANADA_LOCATIONS)];
                $userAddress->setCity('Granada');
            } else {
                $location = self::MADRID_LOCATIONS[($i - 11) % count(self::MADRID_LOCATIONS)];
                $userAddress->setCity('Madrid');
            }
            
            $userAddress->setLat((string)$location['lat']);
            $userAddress->setLng((string)$location['lng']);
            $userAddress->setAddressLine([$location['address'], 'Apt ' . $i]);
            $userAddress->setUser($user);
            
            $this->entityManager->persist($userAddress);
            $this->entityManager->persist($user);
            $createdCount++;
            
            $io->writeln(sprintf('Created user: %s in %s', $email, $userAddress->getCity()));
        }
        
        $this->entityManager->flush();
        
        if ($skippedCount > 0) {
            $io->writeln(sprintf('Skipped %d existing users', $skippedCount));
        }
        $io->writeln(sprintf('Created %d new users', $createdCount));
    }

    private function createRestaurants(SymfonyStyle $io, array $foodTypes): void
    {
        $restaurantRepository = $this->entityManager->getRepository(Restaurant::class);
        $createdCount = 0;
        $skippedCount = 0;
        
        for ($i = 1; $i <= 20; $i++) {
            $email = sprintf('restaurant%d@example.com', $i);
            
            // Skip if restaurant already exists
            if ($restaurantRepository->findOneBy(['email' => $email])) {
                $skippedCount++;
                continue;
            }
            
            $restaurant = new Restaurant();
            $restaurant->setEmail($email);
            $restaurant->setName(self::RESTAURANT_NAMES[($i - 1) % count(self::RESTAURANT_NAMES)]);
            $restaurant->setPhone(sprintf('6%d%d%d%d%d%d%d%d', 
                random_int(0, 9), random_int(0, 9), random_int(0, 9), 
                random_int(0, 9), random_int(0, 9), random_int(0, 9), 
                random_int(0, 9), random_int(0, 9)
            ));
            
            // Set password
            $hashedPassword = $this->passwordHasher->hashPassword($restaurant, 'password123');
            $restaurant->setPassword($hashedPassword);
            $restaurant->setRoles(['ROLE_RESTAURANT']);
            
            // Set opening and closing times
            $openingHour = random_int(8, 11);
            $closingHour = random_int(20, 23);
            $restaurant->setOpeningTime(new \DateTime(sprintf('%d:00:00', $openingHour)));
            $restaurant->setClosingTime(new \DateTime(sprintf('%d:00:00', $closingHour)));
            
            // Set reservation settings
            $restaurant->setTakesReservations(random_int(0, 1) === 1);
            $restaurant->setTableCount(random_int(5, 30));
            $restaurant->setReservationDuration(60); // 1 hour
            
            // Create address
            $restaurantAddress = new RestaurantAddress();
            
            // Half in Granada, half in Madrid
            if ($i <= 10) {
                $location = self::GRANADA_LOCATIONS[($i - 1) % count(self::GRANADA_LOCATIONS)];
                $restaurantAddress->setCity('Granada');
            } else {
                $location = self::MADRID_LOCATIONS[($i - 11) % count(self::MADRID_LOCATIONS)];
                $restaurantAddress->setCity('Madrid');
            }
            
            $restaurantAddress->setLat((string)$location['lat']);
            $restaurantAddress->setLng((string)$location['lng']);
            $restaurantAddress->setAddressLine($location['address']);
            $restaurantAddress->setRestaurant($restaurant);
            
            // Add food types (2-4 random types)
            $numFoodTypes = random_int(2, 4);
            $shuffledFoodTypes = $foodTypes;
            shuffle($shuffledFoodTypes);
            
            for ($j = 0; $j < $numFoodTypes && $j < count($shuffledFoodTypes); $j++) {
                $restaurant->addFoodType($shuffledFoodTypes[$j]);
            }
            
            $this->entityManager->persist($restaurantAddress);
            $this->entityManager->persist($restaurant);
            $createdCount++;
            
            $io->writeln(sprintf('Created restaurant: %s in %s', $email, $restaurantAddress->getCity()));
            
            // Create 5 articles for this restaurant
            $this->createArticlesForRestaurant($restaurant, $io, $i);
        }
        
        $this->entityManager->flush();
        
        if ($skippedCount > 0) {
            $io->writeln(sprintf('Skipped %d existing restaurants', $skippedCount));
        }
        $io->writeln(sprintf('Created %d new restaurants', $createdCount));
    }

    private function createArticlesForRestaurant(Restaurant $restaurant, SymfonyStyle $io, int $restaurantIndex): void
    {
        $articleRepository = $this->entityManager->getRepository(Article::class);
        
        for ($i = 1; $i <= 5; $i++) {
            $articleIndex = (($restaurantIndex - 1) * 5 + $i - 1) % count(self::ARTICLE_NAMES);
            $articleName = self::ARTICLE_NAMES[$articleIndex];
            
            // Check if article already exists for this restaurant
            $existingArticle = $articleRepository->findOneBy([
                'restaurant' => $restaurant,
                'name' => $articleName
            ]);
            
            if ($existingArticle) {
                continue; // Skip if article already exists
            }
            
            $article = new Article();
            $article->setName($articleName);
            $article->setDescription(self::ARTICLE_DESCRIPTIONS[$articleIndex % count(self::ARTICLE_DESCRIPTIONS)]);
            $article->setPrice(sprintf('%.2f', random_int(500, 2500) / 100));
            $article->setListed(true);
            $article->setAvailable(true);
            $article->setRestaurant($restaurant);
            
            // Add random allergies (0-3)
            $numAllergies = random_int(0, 3);
            if ($numAllergies > 0) {
                $shuffledAllergies = self::ALLERGIES;
                shuffle($shuffledAllergies);
                $articleAllergies = array_slice($shuffledAllergies, 0, $numAllergies);
                $article->setAllergies($articleAllergies);
            } else {
                $article->setAllergies(null);
            }
            
            $this->entityManager->persist($article);
            $io->writeln(sprintf('  - Created article: %s for %s', $article->getName(), $restaurant->getName()));
        }
    }
}