import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Search from '../../components/Search';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
    const query = useQuery().get('q')?.trim() || '';
    const navigate = useNavigate();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noResults, setNoResults] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [helpfulLinks, setHelpfulLinks] = useState([]);

    useEffect(() => {
        const performSearch = async () => {
            if (!query) {
                setResults([]);
                setNoResults(false);
                setSuggestions([]);
                setHelpfulLinks([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
                
                if (response.ok) {
                    // If the response is a redirect (status 302), follow it
                    if (response.redirected) {
                        window.location.href = response.url;
                        return;
                    }
                    
                    const data = await response.json();
                    setResults(data.results || []);
                    setNoResults(data.no_results || false);
                    setSuggestions(data.suggestions || []);
                    setHelpfulLinks(data.helpful_links || []);
                } else {
                    console.error('Search failed:', response.statusText);
                    setResults([]);
                    setNoResults(false);
                    setSuggestions([]);
                    setHelpfulLinks([]);
                }
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
                setNoResults(false);
                setSuggestions([]);
                setHelpfulLinks([]);
            } finally {
                setLoading(false);
            }
        };

        performSearch();
    }, [query]);

    if (loading) {
        return (
            <div className="search-container">
                <div className="results-container">
                    <h2 className="text-2xl font-bold mb-6" style={{color: '#CD8B3E'}}>
                        Searching for "{query}"...
                    </h2>
                    <div className="flex justify-center items-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CD8B3E]"></div>
                    </div>
                </div>
            </div>
        );
    }

    return <Search query={query} results={results} noResults={noResults} suggestions={suggestions} helpfulLinks={helpfulLinks} />;
};

export default SearchPage;
