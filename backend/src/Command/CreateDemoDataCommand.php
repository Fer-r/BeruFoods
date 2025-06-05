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
    description: 'Creates demo data: 20 users, 20 restaurants with 5 products each',
)]
class CreateDemoDataCommand extends Command
{
    private const GRANADA_COORDINATES = [
        ['lat' => 37.1773363, 'lng' => -3.5985571], // Plaza Nueva
        ['lat' => 37.1760826, 'lng' => -3.5881388], // Alhambra
        ['lat' => 37.1834447, 'lng' => -3.6035473], // Cathedral
        ['lat' => 37.1969493, 'lng' => -3.624167],  // Science Park
        ['lat' => 37.1789142, 'lng' => -3.6066264], // Realejo
        ['lat' => 37.1826701, 'lng' => -3.5969644], // Albaicín
        ['lat' => 37.1741979, 'lng' => -3.5985571], // Sacromonte
        ['lat' => 37.1618037, 'lng' => -3.5859244], // Genil
        ['lat' => 37.1924509, 'lng' => -3.6145272], // Chana
        ['lat' => 37.1618037, 'lng' => -3.6145272], // Zaidín
    ];

    private const MADRID_COORDINATES = [
        ['lat' => 40.4167754, 'lng' => -3.7037902], // Puerta del Sol
        ['lat' => 40.4152606, 'lng' => -3.6866267], // Retiro Park
        ['lat' => 40.4253735, 'lng' => -3.6844611], // Salamanca
        ['lat' => 40.4233142, 'lng' => -3.7121255], // Gran Vía
        ['lat' => 40.4380638, 'lng' => -3.6795487], // Chamartín
        ['lat' => 40.4123932, 'lng' => -3.7136765], // La Latina
        ['lat' => 40.4332199, 'lng' => -3.7016493], // Chamberí
        ['lat' => 40.4400356, 'lng' => -3.6921335], // Nuevos Ministerios
        ['lat' => 40.4079946, 'lng' => -3.6924553], // Atocha
        ['lat' => 40.4469715, 'lng' => -3.6919832], // Plaza de Castilla
    ];

    private const FOOD_TYPES = [
        'Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese',
        'Thai', 'French', 'Spanish', 'Greek', 'American',
        'Pizza', 'Burgers', 'Seafood', 'Vegetarian', 'Vegan'
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

        // Create food types if they don't exist
        $io->section('Creating Food Types');
        $foodTypes = $this->createFoodTypes($io);

        // Create users
        $io->section('Creating Users');
        $this->createUsers($io);

        // Create restaurants with articles
        $io->section('Creating Restaurants with Articles');
        $this->createRestaurants($io, $foodTypes);

        $io->success('Demo data created successfully!');
        $io->table(
            ['Entity', 'Count'],
            [
                ['Users', '20'],
                ['Restaurants', '20'],
                ['Articles', '100 (5 per restaurant)'],
                ['Food Types', count($foodTypes)],
            ]
        );

        $io->note('All demo accounts use the password: "password123"');

        return Command::SUCCESS;
    }

    private function createFoodTypes(SymfonyStyle $io): array
    {
        $foodTypes = [];
        $existingFoodTypes = $this->entityManager->getRepository(FoodType::class)->findAll();
        
        // If we already have food types, use those
        if (count($existingFoodTypes) > 0) {
            $io->info(sprintf('Using %d existing food types', count($existingFoodTypes)));
            return $existingFoodTypes;
        }
        
        foreach (self::FOOD_TYPES as $name) {
            $foodType = new FoodType();
            $foodType->setName($name);
            $this->entityManager->persist($foodType);
            $foodTypes[] = $foodType;
            $io->writeln(sprintf('Created food type: %s', $name));
        }
        
        $this->entityManager->flush();
        return $foodTypes;
    }

    private function createUsers(SymfonyStyle $io): void
    {
        $userRepository = $this->entityManager->getRepository(User::class);
        
        for ($i = 1; $i <= 20; $i++) {
            $email = sprintf('user%d@example.com', $i);
            
            // Skip if user already exists
            if ($userRepository->findOneBy(['email' => $email])) {
                $io->writeln(sprintf('User %s already exists, skipping', $email));
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
                $coordinates = self::GRANADA_COORDINATES[($i - 1) % count(self::GRANADA_COORDINATES)];
                $userAddress->setCity('Granada');
            } else {
                $coordinates = self::MADRID_COORDINATES[($i - 11) % count(self::MADRID_COORDINATES)];
                $userAddress->setCity('Madrid');
            }
            
            $userAddress->setLat((string)$coordinates['lat']);
            $userAddress->setLng((string)$coordinates['lng']);
            $userAddress->setAddressLine(['Calle Demo ' . $i, 'Apt ' . $i]);
            $userAddress->setUser($user);
            
            $this->entityManager->persist($userAddress);
            $this->entityManager->persist($user);
            
            $io->writeln(sprintf('Created user: %s in %s', $email, $userAddress->getCity()));
        }
        
        $this->entityManager->flush();
    }

    private function createRestaurants(SymfonyStyle $io, array $foodTypes): void
    {
        $restaurantRepository = $this->entityManager->getRepository(Restaurant::class);
        
        for ($i = 1; $i <= 20; $i++) {
            $email = sprintf('restaurant%d@example.com', $i);
            
            // Skip if restaurant already exists
            if ($restaurantRepository->findOneBy(['email' => $email])) {
                $io->writeln(sprintf('Restaurant %s already exists, skipping', $email));
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
                $coordinates = self::GRANADA_COORDINATES[($i - 1) % count(self::GRANADA_COORDINATES)];
                $restaurantAddress->setCity('Granada');
            } else {
                $coordinates = self::MADRID_COORDINATES[($i - 11) % count(self::MADRID_COORDINATES)];
                $restaurantAddress->setCity('Madrid');
            }
            
            $restaurantAddress->setLat((string)$coordinates['lat']);
            $restaurantAddress->setLng((string)$coordinates['lng']);
            $restaurantAddress->setAddressLine('Calle Restaurante Demo ' . $i);
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
            
            $io->writeln(sprintf('Created restaurant: %s in %s', $email, $restaurantAddress->getCity()));
            
            // Create 5 articles for this restaurant
            $this->createArticlesForRestaurant($restaurant, $io);
        }
        
        $this->entityManager->flush();
    }

    private function createArticlesForRestaurant(Restaurant $restaurant, SymfonyStyle $io): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $article = new Article();
            $articleIndex = (($restaurant->getId() ?? 0) * 5 + $i - 1) % count(self::ARTICLE_NAMES);
            
            $article->setName(self::ARTICLE_NAMES[$articleIndex]);
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
            }
            
            $this->entityManager->persist($article);
            $io->writeln(sprintf('  - Created article: %s for %s', $article->getName(), $restaurant->getName()));
        }
    }
}