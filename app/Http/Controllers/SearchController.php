<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\News;
use App\Models\Event;
use App\Models\Announcement;
use App\Models\MassSchedule;
use App\Models\ShrineRector;
use App\Models\SacramentType;
use App\Models\ServerType;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('query');
        
        if (empty($query)) {
            return response()->json(['query' => $query, 'results' => []]);
        }
        
        $searchQuery = strtolower(trim($query));
        $results = [];
        
        // Debug: Log the search query
        \Log::info('Search query: ' . $searchQuery);
        
        
        // Define the static pages to search through with comprehensive content
        $pages = [
            [
                'title' => 'Home',
                'url' => '/',
                'content' => 'Welcome to Diocesan Shrine of San Vicente Ferrer. Our church serves as a spiritual sanctuary in Brgy. Mamatid, City of Cabuyao, Laguna. Join us in worship and experience the divine presence in our community.',
                'keywords' => ['home', 'welcome', 'main', 'index', 'san vicente', 'ferrer', 'shrine', 'diocesan', 'cabuyao', 'laguna', 'mamatid'],
                'sections' => [
                    'Welcome to our Shrine',
                    'A place of worship and devotion',
                    'Join our community of faith',
                    'Experience spiritual growth'
                ]
            ],
            [
                'title' => 'About Us',
                'url' => '/about',
                'content' => 'Learn about the history and mission of our church. The Diocesan Shrine of San Vicente Ferrer has been serving the community since its establishment. We are dedicated to spreading the teachings of Christ and the example of San Vicente Ferrer.',
                'keywords' => ['about', 'history', 'mission', 'church', 'about us', 'san vicente ferrer', 'diocese', 'catholic', 'shrine history', 'parish'],
                'sections' => [
                    'Our History',
                    'Church Mission and Vision',
                    'Parish Community',
                    'Church Leadership',
                    'San Vicente Ferrer Biography'
                ]
            ],
            [
                'title' => 'Prayer Request',
                'url' => '/pray',
                'content' => 'Submit your prayer intentions to our church. We welcome all prayer requests for healing, thanksgiving, guidance, and special intentions. Your prayers will be offered during Holy Mass and special devotions.',
                'keywords' => ['pray', 'prayer', 'request', 'intention', 'mass intention', 'novena', 'petition', 'mass offering', 'special intention', 'healing prayer'],
                'sections' => [
                    'Submit Prayer Requests',
                    'Mass Intentions',
                    'Healing Prayers',
                    'Special Intentions',
                    'Thanksgiving Prayers'
                ]
            ],
            [
                'title' => 'Apply as Server',
                'url' => '/apply',
                'content' => 'Join our church community as a server. We welcome dedicated individuals who wish to serve as altar servers, lectors, choir members, collectors, or ushers. Serve the Lord and our community with your time and talents.',
                'keywords' => ['apply', 'server', 'serve', 'application', 'join', 'altar server', 'lector', 'choir', 'usher', 'collector', 'ministry', 'volunteer'],
                'sections' => [
                    'Server Application',
                    'Ministry Roles',
                    'Service Opportunities',
                    'Volunteer Programs',
                    'Church Service Guidelines'
                ]
            ],
            [
                'title' => 'Appoint Sacrament',
                'url' => '/appoint',
                'content' => 'Schedule sacraments and special services. Book appointments for Baptism, Confirmation, Wedding, Confession, Anointing of the Sick, and other sacred ceremonies. Plan your spiritual milestones with our church.',
                'keywords' => ['appoint', 'sacrament', 'schedule', 'booking', 'appointment', 'baptism', 'confirmation', 'wedding', 'confession', 'communion', 'anointing'],
                'sections' => [
                    'Sacrament Scheduling',
                    'Baptism Requirements',
                    'Wedding Preparations',
                    'Confirmation Process',
                    'Special Ceremonies'
                ]
            ],
            [
                'title' => 'Contact Us',
                'url' => '/contact',
                'content' => 'Get in touch with our church office. Contact us for inquiries, parish services, office hours, and directions. We are here to assist you with your spiritual needs and church-related concerns.',
                'keywords' => ['contact', 'contact us', 'reach', 'message', 'inquiry', 'phone', 'email', 'address', 'location', 'office hours', 'directions'],
                'sections' => [
                    'Church Contact Information',
                    'Office Hours',
                    'Location and Directions',
                    'Parish Office Services',
                    'Send us a Message'
                ]
            ],
            [
                'title' => 'Mass Schedule',
                'url' => '/mass-schedule',
                'content' => 'View our regular mass schedule and special masses. Join us for daily masses, Sunday masses, and special liturgical celebrations throughout the year.',
                'keywords' => ['mass', 'schedule', 'liturgy', 'eucharist', 'holy mass', 'daily mass', 'sunday mass', 'celebration', 'worship'],
                'sections' => [
                    'Daily Mass Schedule',
                    'Sunday Mass Schedule',
                    'Special Masses',
                    'Liturgical Calendar',
                    'Mass Intentions'
                ]
            ],
            [
                'title' => 'Gallery',
                'url' => '/gallery',
                'content' => 'Browse through our photo gallery featuring church events, celebrations, community activities, and special moments in our parish life.',
                'keywords' => ['gallery', 'photos', 'pictures', 'images', 'events', 'celebrations', 'community', 'parish life'],
                'sections' => [
                    'Church Events',
                    'Community Activities',
                    'Special Celebrations',
                    'Parish Life',
                    'Photo Albums'
                ]
            ],
            [
                'title' => 'Virtual Tour',
                'url' => '/virtual-tour',
                'content' => 'Take a virtual 360° tour of our beautiful church. Experience the sacred spaces and architectural beauty of the Diocesan Shrine of San Vicente Ferrer.',
                'keywords' => ['virtual', 'tour', '360', 'church tour', 'explore', 'architecture', 'sacred spaces', 'viceTech'],
                'sections' => [
                    '360° Church Tour',
                    'Sacred Spaces',
                    'Architectural Features',
                    'Interactive Experience'
                ]
            ],
            [
                'title' => 'Give/Donate',
                'url' => '/give',
                'content' => 'Support our church through online donations. Your generous contributions help us continue our mission and serve our community.',
                'keywords' => ['give', 'donate', 'donation', 'contribution', 'support', 'offering', 'tithe', 'financial support'],
                'sections' => [
                    'Online Donations',
                    'Donation Methods',
                    'Support Our Mission',
                    'Financial Contributions'
                ]
            ],
            [
                'title' => 'Calendar',
                'url' => '/calendar',
                'content' => 'View our church calendar with all upcoming events, masses, celebrations, and important dates in our parish community.',
                'keywords' => ['calendar', 'events', 'schedule', 'upcoming', 'dates', 'celebrations', 'parish calendar'],
                'sections' => [
                    'Upcoming Events',
                    'Mass Schedule',
                    'Special Celebrations',
                    'Parish Activities'
                ]
            ]
        ];

        // Simple search through static pages
        foreach ($pages as $page) {
            // Check for exact title match
            if (strtolower($page['title']) === $searchQuery) {
                return redirect($page['url']);
            }
            
            // Check for exact keyword match
            if (in_array($searchQuery, array_map('strtolower', $page['keywords']))) {
                return redirect($page['url']);
            }
            
            // Only check for exact matches in keywords and titles
            $titleMatch = strtolower($page['title']) === $searchQuery;
            $keywordMatch = in_array($searchQuery, array_map('strtolower', $page['keywords']));
            
            // Only return results for exact matches
            if ($titleMatch || $keywordMatch) {
                $matchingSections = array_filter($page['sections'], function($section) use ($query) {
                    return str_contains(strtolower($section), strtolower($query));
                });
                
                $results[] = array_merge($page, [
                    'matching_sections' => array_values($matchingSections)
                ]);
            }
        }
        
        // Search dynamic content from database - only exact title matches
        try {
            // Search News - only exact title matches
            $news = News::where('title', 'LIKE', "%{$searchQuery}%")
                ->limit(3)
                ->get();
                
            foreach ($news as $item) {
                $results[] = [
                    'title' => $item->title,
                    'url' => "/news/{$item->id}",
                    'content' => $item->summary ?: substr(strip_tags($item->content), 0, 200) . '...',
                    'keywords' => ['news', 'article', 'update'],
                    'sections' => [],
                    'matching_sections' => []
                ];
            }
            
            // Search Events - only exact title matches
            $events = Event::where('title', 'LIKE', "%{$searchQuery}%")
                ->limit(3)
                ->get();
                
            foreach ($events as $item) {
                $results[] = [
                    'title' => $item->title,
                    'url' => '/events',
                    'content' => substr(strip_tags($item->description), 0, 200) . '...',
                    'keywords' => ['event', 'activity', 'celebration'],
                    'sections' => [],
                    'matching_sections' => []
                ];
            }
            
            // Search Announcements - only exact title matches
            $announcements = Announcement::where('title', 'LIKE', "%{$searchQuery}%")
                ->limit(3)
                ->get();
                
            foreach ($announcements as $item) {
                $results[] = [
                    'title' => $item->title,
                    'url' => '/events',
                    'content' => substr(strip_tags($item->content), 0, 200) . '...',
                    'keywords' => ['announcement', 'notice', 'update'],
                    'sections' => [],
                    'matching_sections' => []
                ];
            }
        } catch (\Exception $e) {
            \Log::error('Database search error: ' . $e->getMessage());
        }

        // Debug: Log the results
        \Log::info('Search results count: ' . count($results));
        
        // If there's only one result, redirect to that page
        if (count($results) === 1) {
            return redirect($results[0]['url']);
        }

        // If no results found, return simple no results response
        if (count($results) === 0) {
            return response()->json([
                'query' => $query,
                'results' => [],
                'no_results' => true
            ]);
        }

        // Return JSON response with results
        return response()->json([
            'query' => $query,
            'results' => $results
        ]);
    }
} 