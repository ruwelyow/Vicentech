import React from 'react';
import '../../css/search.css';
const Search = ({ query, results, noResults, suggestions, helpfulLinks }) => {
    return (
        <div className="search-container">
            <div className="results-container">
                <h2 className="text-2xl font-bold mb-6" style={{color: '#CD8B3E'}}>
                    Search Results for "{query}"
                </h2>

                {results.length > 0 ? (
                    <div className="space-y-8">
                        {results.map((result, index) => (
                            <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                                <h3 className="text-xl font-semibold mb-2">
                                    <a href={result.url} className="text-[#CD8B3E] hover:text-[#B77B35] transition-colors">
                                        {result.title}
                                    </a>
                                </h3>
                                <p className="text-gray-600 mb-4">{result.content}</p>
                                
                                {result.matching_sections && result.matching_sections.length > 0 && (
                                    <div className="mt-3">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Relevant Sections:</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {result.matching_sections.map((section, idx) => (
                                                <li key={idx} className="text-gray-600 text-sm">{section}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-3 flex flex-wrap gap-2">
                                    {result.keywords.map((keyword, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#CD8B3E]/10 text-[#CD8B3E]">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 px-4 bg-white rounded-xl border border-gray-200 shadow max-w-md mx-auto">
                        <svg className="w-14 h-14 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Results Found</h3>
                        <p className="text-gray-500 mb-4 text-center">We couldn't find any pages matching your search.<br/>Try different keywords.</p>
                        <a href="/" className="mt-1 inline-block px-4 py-1.5 rounded bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition">Back to Home</a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;