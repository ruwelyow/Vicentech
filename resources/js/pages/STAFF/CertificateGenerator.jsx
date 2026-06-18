import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../utils/axios';
import '../../../css/CertificateGenerator.css';

const CertificateGenerator = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    
    const { certificate, mode, recordType } = location.state || {};
    
    const [certificateData, setCertificateData] = useState(null);
    const [template, setTemplate] = useState(null);
    const [priests, setPriests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Template editing state
    const [selectedElement, setSelectedElement] = useState(null);
    // Enable editing for all records (including parish records)
    const [isEditing, setIsEditing] = useState(false);
    const [templateElements, setTemplateElements] = useState([]);
    const [uploadedImages, setUploadedImages] = useState({});
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [editingElementId, setEditingElementId] = useState(null);
    const editingRef = useRef(null);
    
    // Check if this is a parish record
    const isParishRecord = recordType === 'parish-record';
    
    // Form data
    const [formData, setFormData] = useState({
        recipient_name: '',
        child_name_line1: '',
        child_name_line2: '',
        certificate_date: '',
        priest_id: '',
        priest_name: '',
        parent_name: '',
        mother_name: '',
        father_name: '',
        birth_day: '',
        birth_month: '',
        birth_year: '',
        birth_place: '',
        baptism_day: '',
        baptism_month: '',
        baptism_year: '',
        sponsor1: '',
        sponsor2: '',
        record_number: '',
        page_number: '',
        line_number: '',
        date_issued: '',
        purpose: '',
        groom_name: '',
        bride_name: '',
        groom_status: '',
        groom_age: '',
        groom_father: '',
        groom_mother: '',
        bride_status: '',
        bride_age: '',
        bride_father: '',
        bride_mother: '',
        marriage_day: '',
        marriage_month: '',
        marriage_year: '',
        notes: ''
    });

    useEffect(() => {
        if (recordType === 'parish-record' && certificate) {
            // Handle parish record
            loadParishRecordData();
        } else if (certificate?.id) {
            // Handle certificate request
            loadCertificateData();
        } else {
            setError('No certificate data provided');
            setLoading(false);
        }
    }, [certificate, recordType]);

    const loadParishRecordData = async () => {
        try {
            setLoading(true);
            // Get template for the parish record type
            // Map record types to certificate types (funeral -> death)
            const recordType = certificate.certificate_type || certificate.type;
            const certificateTypeMap = {
                'funeral': 'death',
                'baptism': 'baptism',
                'confirmation': 'confirmation',
                'marriage': 'marriage'
            };
            const certificateType = certificateTypeMap[recordType] || recordType;
            const response = await api.get(`/certificate-generation/template/${certificateType}`);
            
            setTemplate(response.data.template);
            setPriests(response.data.priests);
            
            // Use the parish record data directly
            setCertificateData(certificate);
            
            // Extract details from parish record
            const details = certificate.details || {};
            const recordName = certificate.recipient_name || certificate.name || '';
            
            // Parse dates
            const parseDate = (dateStr) => {
                if (!dateStr) return { day: '', month: '', year: '' };
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return { day: '', month: '', year: '' };
                return {
                    day: date.getDate().toString(),
                    month: date.toLocaleString('default', { month: 'long' }),
                    year: date.getFullYear().toString()
                };
            };
            
            const birthDate = parseDate(details.birth_date || '');
            const baptismDate = parseDate(certificate.certificate_date || certificate.date || '');
            
            // Extract parents and godparents
            // Handle both new format (father_name, mother_name) and old format (parents)
            let fatherName = details.father_name || '';
            let motherName = details.mother_name || '';
            
            // If new format doesn't exist, try to parse old format
            if (!fatherName && !motherName && details.parents) {
                const parents = details.parents.trim();
                // Only process if it doesn't match recipient name
                if (parents && parents !== recordName && !parents.includes(recordName)) {
                    // Check if old format contains " and " separator
                    if (parents.includes(' and ')) {
                        const parts = parents.split(' and ').map(p => p.trim());
                        motherName = parts[0] || '';
                        fatherName = parts[1] || '';
                    } else {
                        // If no "and", assume it's just the father's name
                        fatherName = parents;
                    }
                }
            }
            
            // Debug logging
            console.log('Parent name extraction - FINAL:', {
                fatherName,
                motherName,
                oldParents: details.parents,
                recordName
            });
            
            const godparents = details.godparents || '';
            const godparentParts = godparents.split('&').map(g => g.trim()).filter(g => g);
            const sponsor1 = godparentParts[0] || '';
            const sponsor2 = godparentParts[1] || '';
            
            // Find priest by name or use first available
            const priestName = certificate.priest || '';
            let priestId = response.data.priests[0]?.id || '';
            if (priestName) {
                const foundPriest = response.data.priests.find(p => 
                    p.name && p.name.toLowerCase().includes(priestName.toLowerCase())
                );
                if (foundPriest) {
                    priestId = foundPriest.id;
                }
            }
            
            // Use certificate_number from backend, or generate if missing
            // The backend should auto-generate it, but if it's still missing, create a fallback
            let recordNumber = certificate.certificate_number || '';
            if (!recordNumber && certificate.date) {
                const recordDate = new Date(certificate.certificate_date || certificate.date);
                const year = recordDate.getFullYear();
                // Get the original type from certificate (before mapping)
                const originalType = certificate.type || certificate.certificate_type || certificateType;
                const typeCode = originalType.toUpperCase().substring(0, 3);
                // Map types to proper codes
                const typeCodeMap = {
                    'BAP': 'BAP',
                    'CON': 'CON',
                    'MAR': 'MAR',
                    'DEA': 'FUN', // death/funeral
                    'FUN': 'FUN',
                    'DE': 'FUN' // death
                };
                const finalTypeCode = typeCodeMap[typeCode] || typeCode;
                // Use a temporary sequence (backend will generate proper one)
                const sequence = certificate.id || 1;
                recordNumber = `${finalTypeCode}-${year}-${String(sequence).padStart(4, '0')}`;
            }
            
            // Initialize form data from parish record with all baptism fields
            setFormData({
                recipient_name: recordName,
                certificate_date: certificate.certificate_date || certificate.date || '',
                priest_id: priestId,
                priest_name: priestName,
                parent_name: '', // Keep for backward compatibility but not used for display
                mother_name: motherName || '',
                father_name: fatherName || '',
                birth_day: birthDate.day,
                birth_month: birthDate.month,
                birth_year: birthDate.year,
                birth_place: details.birth_place || '',
                baptism_day: baptismDate.day,
                baptism_month: baptismDate.month,
                baptism_year: baptismDate.year,
                sponsor1: sponsor1,
                sponsor2: sponsor2,
                record_number: recordNumber,
                page_number: details.page_number || '',
                line_number: details.line_number || '',
                date_issued: new Date().toISOString().split('T')[0],
                purpose: certificate.purpose || details.purpose || `Certificate of ${certificateType} record`,
                groom_name: certificate.groom_name || details.spouse || '',
                bride_name: certificate.bride_name || '',
                notes: certificate.notes || ''
            });
            
            // Initialize template elements
            if (response.data.template?.template_data?.elements) {
                setTemplateElements(response.data.template.template_data.elements);
            }
            
            // Ensure A4 portrait dimensions for parish records
            if (response.data.template?.template_data) {
                const updatedTemplate = {
                    ...response.data.template,
                    template_data: {
                        ...response.data.template.template_data,
                        dimensions: {
                            width: 794,
                            height: 1123
                        }
                    }
                };
                setTemplate(updatedTemplate);
            }
            
        } catch (err) {
            console.error('Error loading parish record data:', err);
            setError('Failed to load parish record data');
        } finally {
            setLoading(false);
        }
    };

    const loadCertificateData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/certificate-generation/data/${certificate.id}`);
            
            setCertificateData(response.data.certificate_request);
            setTemplate(response.data.template);
            setPriests(response.data.priests);
            
            // Initialize form data
            const requestData = response.data.certificate_request;
            setFormData({
                recipient_name: requestData.recipient_name || '',
                certificate_date: requestData.certificate_date || '',
                priest_id: response.data.priests[0]?.id || '',
                groom_name: requestData.groom_name || '',
                bride_name: requestData.bride_name || '',
                groom_status: requestData.groom_status || '',
                groom_age: requestData.groom_age || '',
                groom_father: requestData.groom_father || '',
                groom_mother: requestData.groom_mother || '',
                bride_status: requestData.bride_status || '',
                bride_age: requestData.bride_age || '',
                bride_father: requestData.bride_father || '',
                bride_mother: requestData.bride_mother || '',
                marriage_day: requestData.marriage_day || '',
                marriage_month: requestData.marriage_month || '',
                marriage_year: requestData.marriage_year || '',
                sponsor1: requestData.sponsor1 || '',
                sponsor2: requestData.sponsor2 || '',
                record_number: requestData.record_number || '',
                page_number: requestData.page_number || '',
                line_number: requestData.line_number || '',
                date_issued: requestData.date_issued || new Date().toISOString().split('T')[0],
                purpose: requestData.purpose || '',
                notes: requestData.notes || ''
            });
            
            // Initialize template elements
            if (response.data.template?.template_data?.elements) {
                setTemplateElements(response.data.template.template_data.elements);
            }
            
        } catch (err) {
            console.error('Error loading certificate data:', err);
            setError('Failed to load certificate data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleElementClick = (element) => {
        // Allow editing when in edit mode
        if (isEditing) {
        setSelectedElement(element);
        }
    };

    const handleDoubleClick = (element) => {
        // Double-click to start editing text content directly
        if (isEditing && element.type === 'text' && !element.content.includes('{{')) {
            setSelectedElement(element);
            // Focus will be handled by the input field autoFocus
        }
    };

    const handleElementUpdate = (elementId, updates) => {
        setTemplateElements(prev => 
            prev.map(el => 
                el.id === elementId 
                    ? { ...el, ...updates }
                    : el
            )
        );
    };

    const handleTextContentChange = (elementId, newContent) => {
        // Find the element to check if it has placeholders
        const element = templateElements.find(el => el.id === elementId);
        if (element && element.content.includes('{{')) {
            // Extract placeholder key from element content
            const placeholderMatch = element.content.match(/\{\{(\w+)\}\}/);
            if (placeholderMatch) {
                const placeholderKey = placeholderMatch[1];
                // Update formData instead of template content
                setFormData(prev => ({
                    ...prev,
                    [placeholderKey]: newContent
                }));
            }
        } else {
            // For non-placeholder elements, update template (though they shouldn't be editable)
            handleElementUpdate(elementId, { content: newContent });
        }
    };

    const handleImageUpload = (elementId, file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            setUploadedImages(prev => ({
                ...prev,
                [elementId]: imageData
            }));
            
            // Update the element with the new image
            handleElementUpdate(elementId, {
                content: imageData,
                type: 'image'
            });
        };
        reader.readAsDataURL(file);
    };

    const handlePositionChange = (elementId, position) => {
        // Get canvas dimensions from template or use A4 default
        const canvasWidth = template?.template_data?.dimensions?.width || 794;
        const canvasHeight = template?.template_data?.dimensions?.height || 1123;
        
        // Get element dimensions
        const element = templateElements.find(el => el.id === elementId);
        const elementWidth = element?.style?.width || 200;
        const elementHeight = element?.style?.height || 50;
        
        // Constrain position to canvas bounds
        const constrainedPosition = {
            x: Math.max(0, Math.min(position.x, canvasWidth - elementWidth)),
            y: Math.max(0, Math.min(position.y, canvasHeight - elementHeight))
        };
        
        handleElementUpdate(elementId, { position: constrainedPosition });
    };

    const handleStyleChange = (elementId, styleUpdates) => {
        handleElementUpdate(elementId, {
            style: { ...templateElements.find(el => el.id === elementId)?.style, ...styleUpdates }
        });
    };

    const handleAlignmentChange = (elementId, alignment) => {
        const styleUpdates = {};
        
        switch (alignment) {
            case 'left':
                styleUpdates.textAlign = 'left';
                break;
            case 'center':
                styleUpdates.textAlign = 'center';
                break;
            case 'right':
                styleUpdates.textAlign = 'right';
                break;
        }
        
        handleStyleChange(elementId, styleUpdates);
    };

    const handleDeleteElement = (elementId) => {
        if (window.confirm('Are you sure you want to delete this element? This action cannot be undone.')) {
            setTemplateElements(prev => prev.filter(el => el.id !== elementId));
            setSelectedElement(null);
            // Also remove from uploadedImages if it's an image
            setUploadedImages(prev => {
                const newImages = { ...prev };
                delete newImages[elementId];
                return newImages;
            });
        }
    };

    const handleAddImageElement = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageUrl = event.target.result;
                    const newElement = {
                        id: `image_${Date.now()}`,
                        type: 'image',
                        content: imageUrl,
                        position: { x: 100, y: 100 },
                        style: {
                            width: 150,
                            height: 150,
                            border: '2px dashed #ccc',
                            borderRadius: '8px'
                        }
                    };
                    setTemplateElements(prev => [...prev, newElement]);
                    setSelectedElement(newElement);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // Drag and drop handlers - optimized for performance
    const handleMouseDown = useCallback((e, element) => {
        if (!isEditing) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        // Check if clicking on resize handle
        if (e.target.classList.contains('resize-handle')) {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
            setResizeHandle(e.target.dataset.handle);
            setSelectedElement(element);
            return;
        }
        
        setIsDragging(true);
        setSelectedElement(element);
        
        const rect = e.currentTarget.getBoundingClientRect();
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        
        if (canvasRect) {
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    }, [isEditing]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging && !isResizing) return;
        if (!selectedElement || !canvasRef.current) return;
        
        e.preventDefault();
        
        const canvasRect = canvasRef.current.getBoundingClientRect();
        
        if (isResizing && resizeHandle) {
            // Simple resize implementation
            const currentWidth = selectedElement.style.width || 150;
            const currentHeight = selectedElement.style.height || 150;
            const currentX = selectedElement.position.x;
            const currentY = selectedElement.position.y;
            
            const mouseX = e.clientX - canvasRect.left;
            const mouseY = e.clientY - canvasRect.top;
            
            let newWidth = currentWidth;
            let newHeight = currentHeight;
            let newX = currentX;
            let newY = currentY;
            
            // Simple resize logic
            if (resizeHandle === 'se') {
                newWidth = Math.max(50, mouseX - currentX);
                newHeight = Math.max(50, mouseY - currentY);
            } else if (resizeHandle === 'sw') {
                newWidth = Math.max(50, currentX + currentWidth - mouseX);
                newHeight = Math.max(50, mouseY - currentY);
                newX = mouseX;
            } else if (resizeHandle === 'ne') {
                newWidth = Math.max(50, mouseX - currentX);
                newHeight = Math.max(50, currentY + currentHeight - mouseY);
                newY = mouseY;
            } else if (resizeHandle === 'nw') {
                newWidth = Math.max(50, currentX + currentWidth - mouseX);
                newHeight = Math.max(50, currentY + currentHeight - mouseY);
                newX = mouseX;
                newY = mouseY;
            }
            
            // Constrain to canvas bounds
            newX = Math.max(0, Math.min(newX, canvasRect.width - newWidth));
            newY = Math.max(0, Math.min(newY, canvasRect.height - newHeight));
            
            // Direct state update for better performance
            setTemplateElements(prev => {
                const newElements = [...prev];
                const elementIndex = newElements.findIndex(el => el.id === selectedElement.id);
                if (elementIndex !== -1) {
                    newElements[elementIndex] = {
                        ...newElements[elementIndex],
                        position: { x: newX, y: newY },
                        style: { ...newElements[elementIndex].style, width: newWidth, height: newHeight }
                    };
                }
                return newElements;
            });
        } else if (isDragging) {
            // Handle dragging
            const newX = e.clientX - canvasRect.left - dragOffset.x;
            const newY = e.clientY - canvasRect.top - dragOffset.y;
            
            // Get element dimensions for better constraint calculation
            const elementWidth = selectedElement.style.width || 200;
            const elementHeight = selectedElement.style.height || 50;
            
            // Constrain to canvas bounds with proper element dimensions
            const constrainedX = Math.max(0, Math.min(newX, canvasRect.width - elementWidth));
            const constrainedY = Math.max(0, Math.min(newY, canvasRect.height - elementHeight));
            
            // Use requestAnimationFrame for smoother updates
            requestAnimationFrame(() => {
                setTemplateElements(prev => 
                    prev.map(el => 
                        el.id === selectedElement.id 
                            ? { ...el, position: { x: constrainedX, y: constrainedY } }
                            : el
                    )
                );
            });
        }
    }, [isDragging, isResizing, selectedElement, dragOffset, resizeHandle]);

    const handleMouseUp = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            setDragOffset({ x: 0, y: 0 });
        }
        if (isResizing) {
            setIsResizing(false);
            setResizeHandle(null);
        }
    }, [isDragging, isResizing]);

    // Add event listeners for drag and resize functionality
    useEffect(() => {
        if (isDragging || isResizing) {
            // Use passive: false for better control
            document.addEventListener('mousemove', handleMouseMove, { passive: false });
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    // Add keyboard shortcut for delete
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' && selectedElement && isEditing) {
                e.preventDefault();
                handleDeleteElement(selectedElement.id);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedElement, isEditing]);

    // Helper function to check if an element is a title
    const isTitleElement = (element) => {
        if (element.id === 'title') return true;
        const originalContent = element.content || '';
        if (typeof originalContent !== 'string') return false;
        const contentUpper = originalContent.toUpperCase().trim();
        // Check for title patterns - must be short and contain certificate type keywords
        return (contentUpper.includes('CERTIFICATE OF') || 
               contentUpper.includes('CERTIFICATE OF BAPTISM') ||
               contentUpper.includes('CERTIFICATE OF CONFIRMATION') ||
               contentUpper.includes('CERTIFICATE OF MARRIAGE') ||
               contentUpper.includes('CERTIFICATE OF FUNERAL') ||
               contentUpper === 'CERTIFICATE OF DEATH' ||
               contentUpper === 'BAPTISMAL CERTIFICATE' ||
               contentUpper === 'CONFIRMATION CERTIFICATE' ||
               contentUpper === 'MARRIAGE CERTIFICATE' ||
               contentUpper === 'FUNERAL CERTIFICATE' ||
               contentUpper === 'DEATH CERTIFICATE') && 
               contentUpper.length < 50; // Titles are typically short
    };

    const renderElement = (element, index) => {
        // Check if this is a title element (by id or content)
        const isTitle = isTitleElement(element);
        
        // Check if this is a death/funeral certificate
        const isDeathCertificate = certificate?.certificate_type === 'death' || 
                                   certificate?.type === 'funeral' || 
                                   certificate?.type === 'death' ||
                                   recordType === 'parish-record' && (certificate?.type === 'funeral' || certificate?.certificate_type === 'death');
        
        // Build proper CSS style object from element.style
        const styleFromTemplate = {};
        if (element.style) {
            if (element.style.fontSize) styleFromTemplate.fontSize = `${element.style.fontSize}px`;
            if (element.style.fontWeight) styleFromTemplate.fontWeight = element.style.fontWeight;
            if (element.style.fontStyle) styleFromTemplate.fontStyle = element.style.fontStyle;
            // Apply blackletter font to title elements - using web fonts for better compatibility
            if (isTitle) {
                styleFromTemplate.fontFamily = '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif';
                styleFromTemplate.fontWeight = styleFromTemplate.fontWeight || 'bold';
                styleFromTemplate.textTransform = styleFromTemplate.textTransform || 'uppercase';
            } else {
                if (element.style.fontFamily) {
                    styleFromTemplate.fontFamily = element.style.fontFamily;
                }
            }
            if (element.style.fontWeight) {
                styleFromTemplate.fontWeight = element.style.fontWeight;
            }
            // For death certificates, ensure non-title elements are never bold (use template value if set, otherwise normal)
            if (isDeathCertificate && !isTitle && !element.style.fontWeight) {
                styleFromTemplate.fontWeight = 'normal';
            }
            if (element.style.textAlign) styleFromTemplate.textAlign = element.style.textAlign;
            if (element.style.color) styleFromTemplate.color = element.style.color;
            if (element.style.width) styleFromTemplate.width = `${element.style.width}px`;
            if (element.style.height) styleFromTemplate.height = `${element.style.height}px`;
            if (element.style.borderBottom) styleFromTemplate.borderBottom = element.style.borderBottom;
            if (element.style.minWidth) styleFromTemplate.minWidth = element.style.minWidth;
            if (element.style.display) styleFromTemplate.display = element.style.display;
            if (element.style.letterSpacing) styleFromTemplate.letterSpacing = element.style.letterSpacing;
            if (element.style.textTransform) styleFromTemplate.textTransform = element.style.textTransform;
            // Handle left positioning for centered elements
            if (element.style.left !== undefined) {
                styleFromTemplate.left = `${element.style.left}px`;
            }
        } else if (isTitle) {
            // If no style object but it's a title, apply blackletter font - using web fonts
            styleFromTemplate.fontFamily = '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif';
            styleFromTemplate.fontWeight = 'bold';
            styleFromTemplate.textTransform = 'uppercase';
        }
        
            // Build element style - ensure borderBottom is preserved
            // For centered elements, use left from style if provided, otherwise use position.x
            const leftPosition = styleFromTemplate.left || `${element.position.x}px`;
        const elementStyle = {
            position: 'absolute',
            left: leftPosition,
            top: `${element.position.y}px`,
            ...styleFromTemplate,
            // Ensure title elements get the blackletter font - override any conflicting styles
            ...(isTitle && {
                fontFamily: '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif',
                fontWeight: styleFromTemplate.fontWeight || 'bold',
                textTransform: styleFromTemplate.textTransform || 'uppercase'
            }),
            // For death certificates, ensure non-title elements are never bold and have reasonable font sizes
            ...(isDeathCertificate && !isTitle && {
                // Only override fontWeight if not explicitly set in template
                ...(!styleFromTemplate.fontWeight ? { fontWeight: 'normal' } : {}),
                // Ensure font size is not too large (max 16px for non-title elements)
                ...(styleFromTemplate.fontSize && parseFloat(styleFromTemplate.fontSize) > 16 ? { fontSize: '16px' } : {})
            }),
            cursor: isEditing ? (isDragging ? 'grabbing' : 'grab') : 'default',
            zIndex: selectedElement?.id === element.id ? 10 : 1,
            userSelect: 'none',
            pointerEvents: isEditing ? 'auto' : 'none'
        };
        
        // Handle border - if element has borderBottom, preserve it; otherwise add selection border
        if (element.style?.borderBottom) {
            // For elements with borderBottom (blank lines), ensure it's always visible
            elementStyle.borderBottom = element.style.borderBottom;
            elementStyle.border = 'none'; // Remove any other borders
            elementStyle.minHeight = '20px';
            elementStyle.display = 'inline-block';
        } else if (isEditing && selectedElement?.id === element.id) {
            // Show selection border for non-blank-line elements when selected in edit mode
            elementStyle.border = '2px dashed #007bff';
        } else {
            elementStyle.border = 'none';
        }

        switch (element.type) {
            case 'text':
                // Add class for elements with border-bottom (blank lines)
                const hasUnderline = element.style?.borderBottom ? 'has-underline' : '';
                
                // Check if this element contains placeholders (dynamic content)
                const hasPlaceholders = element.content.includes('{{');
                
                // Render content - replace placeholders with actual data
                let displayContent = element.content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                            switch (key) {
                                case 'recipient_name':
                                    if (certificate?.certificate_type === 'marriage' && formData.groom_name) {
                                        return formData.groom_name;
                                    }
                                        return formData.recipient_name || '';
                                    case 'child_name_line1':
                            return formData.recipient_name || '';
                                    case 'child_name_line2':
                            return '';
                                case 'certificate_date':
                                        return formData.certificate_date || '';
                                case 'priest_name':
                                        return formData.priest_name || priests.find(p => p.id === parseInt(formData.priest_id))?.name || '';
                                    case 'parent_name':
                                        return formData.parent_name || '';
                                    case 'mother_name':
                                        return formData.mother_name || '';
                                    case 'father_name':
                                        return formData.father_name || '';
                                    case 'birth_day':
                                        return formData.birth_day || '';
                                    case 'birth_month':
                                        return formData.birth_month || '';
                                    case 'birth_year':
                                        return formData.birth_year || '';
                                    case 'birth_place':
                                        return formData.birth_place || '';
                                    case 'baptism_day':
                                        return formData.baptism_day || '';
                                    case 'baptism_month':
                                        return formData.baptism_month || '';
                                    case 'baptism_year':
                                        return formData.baptism_year || '';
                                    case 'sponsor1':
                                        return formData.sponsor1 || '';
                                    case 'sponsor2':
                                        return formData.sponsor2 || '';
                                    case 'record_number':
                                        return formData.record_number || '';
                                    case 'page_number':
                                        return formData.page_number || '';
                                    case 'line_number':
                                        return formData.line_number || '';
                                    case 'date_issued':
                                        if (formData.date_issued) {
                                            const date = new Date(formData.date_issued);
                                            if (!isNaN(date.getTime())) {
                                                return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                                            }
                                        }
                                        return formData.date_issued || '';
                                    case 'purpose':
                                        return formData.purpose || '';
                                case 'groom_name':
                                        return formData.groom_name || '';
                                case 'bride_name':
                                        return formData.bride_name || '';
                        case 'groom_status':
                            return formData.groom_status || '';
                        case 'groom_age':
                            return formData.groom_age || '';
                        case 'groom_father':
                            return formData.groom_father || '';
                        case 'groom_mother':
                            return formData.groom_mother || '';
                        case 'bride_status':
                            return formData.bride_status || '';
                        case 'bride_age':
                            return formData.bride_age || '';
                        case 'bride_father':
                            return formData.bride_father || '';
                        case 'bride_mother':
                            return formData.bride_mother || '';
                        case 'marriage_day':
                            return formData.marriage_day || '';
                        case 'marriage_month':
                            return formData.marriage_month || '';
                        case 'marriage_year':
                            return formData.marriage_year || '';
                                case 'unique_reference':
                                    return 'REF-' + Date.now();
                                default:
                                    return match;
                            }
                            });
                            
                // For elements with border-bottom (blank lines), ensure they always show the line
                if (element.style?.borderBottom && !displayContent.trim()) {
                    displayContent = '\u00A0'; // Non-breaking space
                }
                
                // If in edit mode, make ONLY elements with placeholders (dynamic content) editable
                if (isEditing && hasPlaceholders) {
                    // Extract placeholder key to know which formData field to update
                    const placeholderMatch = element.content.match(/\{\{(\w+)\}\}/);
                    const placeholderKey = placeholderMatch ? placeholderMatch[1] : null;
                    const isCurrentlyEditing = editingElementId === element.id;
                    
                    // Check if this is a title element for font styling
                    const isTitle = isTitleElement(element);
                    
                    // Use input element for better control over editing
                    return (
                        <div
                            key={`${element.id}-${index}`}
                            className={`template-element text-element ${hasUnderline} ${isTitle ? 'title-element' : ''} ${isDragging && selectedElement?.id === element.id ? 'dragging' : ''} editable`}
                            data-is-title={isTitle ? 'true' : 'false'}
                            style={elementStyle}
                            onClick={(e) => {
                                if (isEditing && e.target.tagName !== 'INPUT') {
                                    setSelectedElement(element);
                                    setEditingElementId(element.id);
                                }
                            }}
                            onMouseDown={(e) => {
                                // If clicking on input, don't start drag
                                if (e.target.tagName === 'INPUT') {
                                    e.stopPropagation();
                                    return;
                                }
                                // If user clicks on the text (not dragging), focus for editing
                                // Only start dragging if user actually moves the mouse
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const handleMouseMove = (moveEvent) => {
                                    const deltaX = Math.abs(moveEvent.clientX - startX);
                                    const deltaY = Math.abs(moveEvent.clientY - startY);
                                    // If moved more than 5px, it's a drag
                                    if (deltaX > 5 || deltaY > 5) {
                                        handleMouseDown(e, element);
                                        document.removeEventListener('mousemove', handleMouseMove);
                                    }
                                };
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', () => {
                                    document.removeEventListener('mousemove', handleMouseMove);
                                }, { once: true });
                            }}
                        >
                            <input
                                type="text"
                                value={displayContent}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    if (placeholderKey) {
                                        // Special handling for "Rev. {{priest_name}}" - extract just the name part
                                        let valueToSave = newValue;
                                        if (element.content.includes('Rev. {{priest_name}}') || element.content.includes('Rev. {{' + placeholderKey + '}}')) {
                                            // Remove "Rev. " prefix if present
                                            valueToSave = newValue.replace(/^Rev\.\s*/i, '').trim();
                                        }
                                        setFormData(prev => ({
                                            ...prev,
                                            [placeholderKey]: valueToSave
                                        }));
                                    }
                                }}
                                onFocus={() => {
                                    setEditingElementId(element.id);
                                    setSelectedElement(element);
                                }}
                                onBlur={() => {
                                    setEditingElementId(null);
                                }}
                                onKeyDown={(e) => {
                                    // Prevent Enter from creating new lines
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.target.blur();
                                    }
                                    // Stop propagation to prevent dragging when typing
                                    e.stopPropagation();
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    outline: isCurrentlyEditing ? '2px solid #007bff' : 'none',
                                    background: isCurrentlyEditing ? 'rgba(0, 123, 255, 0.05)' : 'transparent',
                                    font: 'inherit',
                                    color: 'inherit',
                                    padding: '2px',
                                    margin: 0,
                                    fontSize: element.style?.fontSize || 'inherit',
                                    fontFamily: isTitle 
                                        ? '"Uncial Antiqua", "MedievalSharp", "Monotype Old English Text Std", "Old English Text MT", "Old English", "Blackletter", "Fraktur", "Gothic", serif'
                                        : (element.style?.fontFamily || 'inherit'),
                                    fontWeight: element.style?.fontWeight || 'inherit',
                                    fontStyle: element.style?.fontStyle || 'inherit',
                                    textAlign: element.style?.textAlign || 'inherit',
                                    textTransform: element.style?.textTransform || 'inherit',
                                    letterSpacing: element.style?.letterSpacing || 'inherit',
                                    minWidth: element.style?.minWidth || 'auto',
                                    display: 'inline-block',
                                    boxSizing: 'border-box'
                                }}
                                autoFocus={isCurrentlyEditing}
                            />
                        </div>
                    );
                }
                
                // Regular display mode (not in edit mode) or static template elements (no placeholders)
                // Static template elements should not be editable or draggable
                if (isEditing && !hasPlaceholders) {
                    // Check if this is a title element for CSS class
                    const isTitleForStatic = isTitleElement(element);
                    
                    // Static template element - not editable, not draggable
                    return (
                        <div
                            key={`${element.id}-${index}`}
                            className={`template-element text-element ${hasUnderline} ${isTitleForStatic ? 'title-element' : ''}`}
                            data-is-title={isTitleForStatic ? 'true' : 'false'}
                            style={{
                                ...elementStyle,
                                pointerEvents: 'none',
                                cursor: 'default',
                                userSelect: 'none'
                            }}
                        >
                            {displayContent}
                        </div>
                    );
                }
                
                // Regular display mode (not in edit mode)
                // Check if this is a title element for CSS class
                const isTitleForClass = isTitleElement(element);
                
                return (
                    <div
                        key={`${element.id}-${index}`}
                        className={`template-element text-element ${hasUnderline} ${isTitleForClass ? 'title-element' : ''} ${isDragging && selectedElement?.id === element.id ? 'dragging' : ''}`}
                        data-is-title={isTitleForClass ? 'true' : 'false'}
                        style={elementStyle}
                        onClick={() => handleElementClick(element)}
                        onMouseDown={(e) => handleMouseDown(e, element)}
                    >
                        {displayContent}
                    </div>
                );
            
            case 'image':
                return (
                    <div
                        key={`${element.id}-${index}`}
                        className={`template-element image-element ${isDragging && selectedElement?.id === element.id ? 'dragging' : ''} ${selectedElement?.id === element.id ? 'selected' : ''}`}
                        style={elementStyle}
                        onClick={() => handleElementClick(element)}
                        onMouseDown={(e) => handleMouseDown(e, element)}
                    >
                        <img
                            src={uploadedImages[element.id] || element.content}
                            alt={element.id}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                        {isEditing && selectedElement?.id === element.id && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteElement(element.id);
                                    }}
                                    className="image-delete-btn"
                                    title="Delete Image"
                                    style={{
                                        position: 'absolute',
                                        top: '-10px',
                                        right: '-10px',
                                        width: '30px',
                                        height: '30px',
                                        borderRadius: '50%',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: '2px solid white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        zIndex: 1000,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    ×
                                </button>
                                <div 
                                    className="resize-handle resize-handle-se" 
                                    data-handle="se"
                                    onMouseDown={(e) => handleMouseDown(e, element)}
                                ></div>
                                <div 
                                    className="resize-handle resize-handle-sw" 
                                    data-handle="sw"
                                    onMouseDown={(e) => handleMouseDown(e, element)}
                                ></div>
                                <div 
                                    className="resize-handle resize-handle-ne" 
                                    data-handle="ne"
                                    onMouseDown={(e) => handleMouseDown(e, element)}
                                ></div>
                                <div 
                                    className="resize-handle resize-handle-nw" 
                                    data-handle="nw"
                                    onMouseDown={(e) => handleMouseDown(e, element)}
                                ></div>
                            </>
                        )}
                    </div>
                );
            
            case 'signature':
                return (
                    <div
                        key={`${element.id}-${index}`}
                        className={`template-element signature-element ${isDragging && selectedElement?.id === element.id ? 'dragging' : ''}`}
                        style={elementStyle}
                        onClick={() => handleElementClick(element)}
                        onMouseDown={(e) => handleMouseDown(e, element)}
                    >
                        <div className="signature-placeholder">
                            {priests.find(p => p.id === parseInt(formData.priest_id))?.esignature_path ? (
                                <img
                                    src={priests.find(p => p.id === parseInt(formData.priest_id))?.esignature_path}
                                    alt="Priest Signature"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <span>Priest Signature</span>
                            )}
                        </div>
                    </div>
                );
            
            case 'decoration':
                return (
                    <div
                        key={`${element.id}-${index}`}
                        className={`template-element decoration-element ${isDragging && selectedElement?.id === element.id ? 'dragging' : ''}`}
                        style={elementStyle}
                        onClick={() => handleElementClick(element)}
                        onMouseDown={(e) => handleMouseDown(e, element)}
                    >
                        <div className="decoration-content">
                            {element.content}
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    const saveTemplate = async () => {
        try {
            const updatedTemplate = {
                ...template,
                template_data: {
                    ...template.template_data,
                    elements: templateElements
                }
            };
            
            await api.post('/certificate-generation/template', updatedTemplate);
            alert('Template saved successfully!');
        } catch (err) {
            console.error('Error saving template:', err);
            alert('Failed to save template');
        }
    };

    const generateCertificate = async () => {
        try {
            // Determine if this is a parish record
            const isParishRecord = recordType === 'parish-record';
            
            let certificateData;
            
            if (isParishRecord) {
                // For parish records, don't include certificate_request_id
                // Map record types to certificate types (funeral -> death)
                const recordTypeValue = certificate.certificate_type || certificate.type;
                const certificateTypeMap = {
                    'funeral': 'death',
                    'baptism': 'baptism',
                    'confirmation': 'confirmation',
                    'marriage': 'marriage'
                };
                const mappedCertificateType = certificateTypeMap[recordTypeValue] || recordTypeValue;
                certificateData = {
                    certificate_template_id: template.id,
                    certificate_type: mappedCertificateType,
                    recipient_name: formData.recipient_name || certificate.name || '',
                    recipient_email: certificate.email || '',
                    priest_id: parseInt(formData.priest_id),
                    certificate_date: formData.certificate_date,
                    certificate_data: {
                        template_elements: templateElements,
                        form_data: formData,
                        uploaded_images: uploadedImages
                    },
                    notes: formData.notes || ''
                };
            } else {
                // For regular certificate requests
                certificateData = {
                certificate_request_id: certificate.id,
                certificate_template_id: template.id,
                priest_id: parseInt(formData.priest_id),
                certificate_date: formData.certificate_date,
                certificate_data: {
                    template_elements: templateElements,
                    form_data: formData,
                    uploaded_images: uploadedImages
                },
                notes: formData.notes || ''
            };
            }
            
            const response = await api.post('/certificate-generation/generate', certificateData);
            
            if (response.data.download_url) {
                // Automatically download the PDF
                const link = document.createElement('a');
                link.href = response.data.download_url;
                link.download = `certificate-${response.data.certificate_release.unique_reference}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            alert('Certificate generated successfully! PDF downloaded.');
            
            // Navigate back to appropriate page
            if (isParishRecord) {
                navigate('/staff/parish-records');
            } else {
            navigate('/staff/certificates');
            }
        } catch (err) {
            console.error('Error generating certificate:', err);
            alert('Failed to generate certificate: ' + (err.response?.data?.message || err.message));
        }
    };

    const ElementEditor = () => {
        if (!selectedElement) return null;
        
        return (
            <div className="element-editor">
                <h3>Edit Element: {selectedElement.id}</h3>
                
                <div className="editor-section">
                    <label>Position:</label>
                    <div className="position-controls">
                        <input
                            type="number"
                            placeholder="X"
                            value={selectedElement.position.x}
                            onChange={(e) => handlePositionChange(selectedElement.id, {
                                ...selectedElement.position,
                                x: parseInt(e.target.value) || 0
                            })}
                        />
                        <input
                            type="number"
                            placeholder="Y"
                            value={selectedElement.position.y}
                            onChange={(e) => handlePositionChange(selectedElement.id, {
                                ...selectedElement.position,
                                y: parseInt(e.target.value) || 0
                            })}
                        />
                    </div>
                </div>
                
                {selectedElement.type === 'text' && (
                    <>
                        <div className="editor-section">
                            <label>Text Content:</label>
                            <textarea
                                value={selectedElement.content || ''}
                                onChange={(e) => handleTextContentChange(selectedElement.id, e.target.value)}
                                className="form-control"
                                rows="3"
                                placeholder="Enter text content or use placeholders like {{recipient_name}} for dynamic content"
                            />
                            <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                                Use placeholders like {'{{recipient_name}}'}, {'{{birth_day}}'}, etc. for dynamic content
                            </small>
                        </div>
                        
                        <div className="editor-section">
                            <label>Font Size:</label>
                            <input
                                type="number"
                                value={selectedElement.style.fontSize || 14}
                                onChange={(e) => handleStyleChange(selectedElement.id, {
                                    fontSize: parseInt(e.target.value) || 14
                                })}
                            />
                        </div>
                        
                        <div className="editor-section">
                            <label>Color:</label>
                            <input
                                type="color"
                                value={selectedElement.style.color || '#000000'}
                                onChange={(e) => handleStyleChange(selectedElement.id, {
                                    color: e.target.value
                                })}
                            />
                        </div>
                        
                        <div className="editor-section">
                            <label>Font Style:</label>
                            <select
                                value={selectedElement.style.fontStyle || 'normal'}
                                onChange={(e) => handleStyleChange(selectedElement.id, {
                                    fontStyle: e.target.value
                                })}
                                className="form-control"
                            >
                                <option value="normal">Normal</option>
                                <option value="italic">Italic</option>
                            </select>
                        </div>
                        
                        <div className="editor-section">
                            <label>Font Weight:</label>
                            <select
                                value={selectedElement.style.fontWeight || 'normal'}
                                onChange={(e) => handleStyleChange(selectedElement.id, {
                                    fontWeight: e.target.value
                                })}
                                className="form-control"
                            >
                                <option value="normal">Normal</option>
                                <option value="bold">Bold</option>
                            </select>
                        </div>
                        
                        <div className="editor-section">
                            <label>Alignment:</label>
                            <div className="alignment-controls">
                                <button
                                    className={selectedElement.style.textAlign === 'left' ? 'active' : ''}
                                    onClick={() => handleAlignmentChange(selectedElement.id, 'left')}
                                >
                                    ←
                                </button>
                                <button
                                    className={selectedElement.style.textAlign === 'center' ? 'active' : ''}
                                    onClick={() => handleAlignmentChange(selectedElement.id, 'center')}
                                >
                                    ↔
                                </button>
                                <button
                                    className={selectedElement.style.textAlign === 'right' ? 'active' : ''}
                                    onClick={() => handleAlignmentChange(selectedElement.id, 'right')}
                                >
                                    →
                                </button>
                            </div>
                        </div>
                    </>
                )}
                
                {selectedElement.type === 'image' && (
                    <div className="editor-section">
                        <label>Image Upload:</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    handleImageUpload(selectedElement.id, e.target.files[0]);
                                }
                            }}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="upload-image-btn"
                        >
                            📷 Upload New Image
                        </button>
                    </div>
                )}
                
                <div className="editor-section">
                    <label>Size:</label>
                    <div className="size-controls">
                        <input
                            type="number"
                            placeholder="Width"
                            value={selectedElement.style.width || 100}
                            onChange={(e) => handleStyleChange(selectedElement.id, {
                                width: parseInt(e.target.value) || 100
                            })}
                        />
                        <input
                            type="number"
                            placeholder="Height"
                            value={selectedElement.style.height || 100}
                            onChange={(e) => handleStyleChange(selectedElement.id, {
                                height: parseInt(e.target.value) || 100
                            })}
                        />
                    </div>
                </div>
                
                <div className="editor-actions">
                    <button 
                        onClick={() => handleDeleteElement(selectedElement.id)} 
                        className="btn btn-danger"
                        style={{ backgroundColor: '#dc3545', color: 'white', marginRight: '10px' }}
                    >
                        🗑️ Delete Element
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary">
                        Close Editor
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="certificate-generator">
                <div className="loading">Loading certificate data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="certificate-generator">
                <div className="error">{error}</div>
                <button onClick={() => navigate('/staff/certificates')} className="btn btn-primary">
                    Back to Certificates
                </button>
            </div>
        );
    }

    return (
        <div className={`certificate-generator ${isParishRecord ? 'parish-record-view' : ''} ${isEditing ? 'editing' : ''}`}>
            <div className="generator-header">
                <div className="header-actions">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`btn ${isEditing ? 'btn-warning' : 'btn-info'}`}
                    >
                        {isEditing ? 'Exit Edit Mode' : 'Edit Template'}
                    </button>
                    {isEditing && (
                        <button onClick={handleAddImageElement} className="btn btn-secondary">
                            📷 Add Image
                        </button>
                    )}
                    {isEditing && (
                    <button onClick={saveTemplate} className="btn btn-success">
                        Save Template
                    </button>
                    )}
                    <button onClick={generateCertificate} className="btn btn-primary">
                        Generate Certificate
                    </button>
                    {isParishRecord && (
                        <button onClick={() => navigate('/staff/parish-records')} className="btn btn-secondary">
                            Back to Records
                        </button>
                    )}
                </div>
            </div>

            <div className={`generator-content ${isParishRecord ? 'parish-record-mode' : ''}`}>
                {!isParishRecord && (
                <div className="form-panel" style={{ maxHeight: '100vh', overflowY: 'auto' }}>
                    <h3>Certificate Information</h3>
                    
                    {/* Baptism Certificate Fields */}
                    {(certificate?.certificate_type === 'baptism' || certificate?.type === 'baptism' || recordType === 'parish-record') && (
                        <>
                            <div className="form-group">
                                <label>Child's Name (Line 1):</label>
                                <input
                                    type="text"
                                    name="child_name_line1"
                                    value={formData.child_name_line1}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="First part of name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Child's Name (Line 2):</label>
                                <input
                                    type="text"
                                    name="child_name_line2"
                                    value={formData.child_name_line2}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Second part of name (if needed)"
                                />
                            </div>
                            <div className="form-group">
                                <label>Parent's Name:</label>
                                <input
                                    type="text"
                                    name="parent_name"
                                    value={formData.parent_name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Parents' names"
                                />
                            </div>
                            <div className="form-group">
                                <label>Birth Date - Day:</label>
                                <input
                                    type="text"
                                    name="birth_day"
                                    value={formData.birth_day}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Day"
                                />
                            </div>
                            <div className="form-group">
                                <label>Birth Date - Month:</label>
                                <input
                                    type="text"
                                    name="birth_month"
                                    value={formData.birth_month}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Month"
                                />
                            </div>
                            <div className="form-group">
                                <label>Birth Date - Year:</label>
                                <input
                                    type="text"
                                    name="birth_year"
                                    value={formData.birth_year}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Year"
                                />
                            </div>
                            <div className="form-group">
                                <label>Birth Place:</label>
                                <input
                                    type="text"
                                    name="birth_place"
                                    value={formData.birth_place}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Place of birth"
                                />
                            </div>
                            <div className="form-group">
                                <label>Baptism Date - Day:</label>
                                <input
                                    type="text"
                                    name="baptism_day"
                                    value={formData.baptism_day}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Day"
                                />
                            </div>
                            <div className="form-group">
                                <label>Baptism Date - Month:</label>
                                <input
                                    type="text"
                                    name="baptism_month"
                                    value={formData.baptism_month}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Month"
                                />
                            </div>
                            <div className="form-group">
                                <label>Baptism Date - Year:</label>
                                <input
                                    type="text"
                                    name="baptism_year"
                                    value={formData.baptism_year}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Year"
                                />
                            </div>
                            <div className="form-group">
                                <label>Priest Name:</label>
                                <input
                                    type="text"
                                    name="priest_name"
                                    value={formData.priest_name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Priest's name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Sponsor/Godparent 1:</label>
                                <input
                                    type="text"
                                    name="sponsor1"
                                    value={formData.sponsor1}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="First sponsor"
                                />
                            </div>
                            <div className="form-group">
                                <label>Sponsor/Godparent 2:</label>
                                <input
                                    type="text"
                                    name="sponsor2"
                                    value={formData.sponsor2}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Second sponsor"
                                />
                            </div>
                            <div className="form-group">
                                <label>Record Number:</label>
                                <input
                                    type="text"
                                    name="record_number"
                                    value={formData.record_number}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Record number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Page Number:</label>
                                <input
                                    type="text"
                                    name="page_number"
                                    value={formData.page_number}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Page number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Line Number:</label>
                                <input
                                    type="text"
                                    name="line_number"
                                    value={formData.line_number}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Line number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date Issued:</label>
                                <input
                                    type="date"
                                    name="date_issued"
                                    value={formData.date_issued}
                                    onChange={handleInputChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Purpose:</label>
                                <input
                                    type="text"
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Purpose of certificate"
                                />
                            </div>
                        </>
                    )}
                    
                    {/* Show recipient name for non-marriage certificates (if not baptism) */}
                    {certificate?.certificate_type !== 'marriage' && certificate?.certificate_type !== 'baptism' && certificate?.type !== 'baptism' && (
                        <div className="form-group">
                            <label>Recipient Name:</label>
                            <input
                                type="text"
                                name="recipient_name"
                                value={formData.recipient_name}
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="Enter recipient's name"
                            />
                        </div>
                    )}
                    
                    <div className="form-group">
                        <label>Certificate Date:</label>
                        <input
                            type="date"
                            name="certificate_date"
                            value={formData.certificate_date}
                            onChange={handleInputChange}
                            className="form-control"
                        />
                    </div>
                    
                    <div className="form-group">
                        <label>Priest:</label>
                        <select
                            name="priest_id"
                            value={formData.priest_id}
                            onChange={handleInputChange}
                            className="form-control"
                        >
                            <option value="">Select Priest</option>
                            {priests.map(priest => (
                                <option key={priest.id} value={priest.id}>
                                    {priest.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Show groom/bride fields for marriage certificates */}
                    {certificate?.certificate_type === 'marriage' && (
                        <>
                            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Groom Information</h4>
                            <div className="form-group">
                                <label>Groom Name:</label>
                                <input
                                    type="text"
                                    name="groom_name"
                                    value={formData.groom_name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Enter groom's name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Groom Status:</label>
                                <input
                                    type="text"
                                    name="groom_status"
                                    value={formData.groom_status}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="e.g., Single, Widower"
                                />
                            </div>
                            <div className="form-group">
                                <label>Groom Age:</label>
                                <input
                                    type="text"
                                    name="groom_age"
                                    value={formData.groom_age}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Age"
                                />
                            </div>
                            <div className="form-group">
                                <label>Groom's Father:</label>
                                <input
                                    type="text"
                                    name="groom_father"
                                    value={formData.groom_father}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Father's name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Groom's Mother:</label>
                                <input
                                    type="text"
                                    name="groom_mother"
                                    value={formData.groom_mother}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Mother's name"
                                />
                            </div>
                            
                            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Bride Information</h4>
                            <div className="form-group">
                                <label>Bride Name:</label>
                                <input
                                    type="text"
                                    name="bride_name"
                                    value={formData.bride_name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Enter bride's name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Bride Status:</label>
                                <input
                                    type="text"
                                    name="bride_status"
                                    value={formData.bride_status}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="e.g., Single, Widow"
                                />
                            </div>
                            <div className="form-group">
                                <label>Bride Age:</label>
                                <input
                                    type="text"
                                    name="bride_age"
                                    value={formData.bride_age}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Age"
                                />
                            </div>
                            <div className="form-group">
                                <label>Bride's Father:</label>
                                <input
                                    type="text"
                                    name="bride_father"
                                    value={formData.bride_father}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Father's name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Bride's Mother:</label>
                                <input
                                    type="text"
                                    name="bride_mother"
                                    value={formData.bride_mother}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Mother's name"
                                />
                            </div>
                            
                            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Marriage Date</h4>
                            <div className="form-group">
                                <label>Marriage Date - Day:</label>
                                <input
                                    type="text"
                                    name="marriage_day"
                                    value={formData.marriage_day}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Day"
                                />
                            </div>
                            <div className="form-group">
                                <label>Marriage Date - Month:</label>
                                <input
                                    type="text"
                                    name="marriage_month"
                                    value={formData.marriage_month}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Month"
                                />
                            </div>
                            <div className="form-group">
                                <label>Marriage Date - Year:</label>
                                <input
                                    type="text"
                                    name="marriage_year"
                                    value={formData.marriage_year}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Year"
                                />
                            </div>
                            
                            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Witnesses/Sponsors</h4>
                            <div className="form-group">
                                <label>Sponsor/Witness 1:</label>
                                <input
                                    type="text"
                                    name="sponsor1"
                                    value={formData.sponsor1}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="First sponsor/witness"
                                />
                            </div>
                            <div className="form-group">
                                <label>Sponsor/Witness 2:</label>
                                <input
                                    type="text"
                                    name="sponsor2"
                                    value={formData.sponsor2}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Second sponsor/witness"
                                />
                            </div>
                            
                            <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Record Information</h4>
                            <div className="form-group">
                                <label>Record Number:</label>
                                <input
                                    type="text"
                                    name="record_number"
                                    value={formData.record_number}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Record number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Page Number:</label>
                                <input
                                    type="text"
                                    name="page_number"
                                    value={formData.page_number}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Page number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Line Number:</label>
                                <input
                                    type="text"
                                    name="line_number"
                                    value={formData.line_number}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Line number"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date Issued:</label>
                                <input
                                    type="date"
                                    name="date_issued"
                                    value={formData.date_issued}
                                    onChange={handleInputChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label>Purpose:</label>
                                <input
                                    type="text"
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="Purpose of certificate"
                                />
                            </div>
                        </>
                    )}
                    
                    <div className="form-group">
                        <label>Notes:</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            className="form-control"
                            rows="3"
                        />
                    </div>
                </div>
                )}

                <div className={`template-panel ${isParishRecord || certificate?.certificate_type === 'marriage' ? 'parish-record-panel' : ''}`}>
                    <div className={`template-container ${isParishRecord || certificate?.certificate_type === 'marriage' ? 'parish-record-container' : ''}`}>
                        <div
                            ref={canvasRef}
                            className={`certificate-canvas ${isParishRecord || certificate?.certificate_type === 'marriage' ? 'a4-portrait' : ''} ${
                                certificate?.certificate_type === 'baptism' || certificate?.type === 'baptism' || (recordType === 'parish-record' && (certificate?.type === 'baptism' || certificate?.certificate_type === 'baptism')) ? 'certificate-baptism' :
                                certificate?.certificate_type === 'confirmation' || certificate?.type === 'confirmation' || (recordType === 'parish-record' && (certificate?.type === 'confirmation' || certificate?.certificate_type === 'confirmation')) ? 'certificate-confirmation' :
                                certificate?.certificate_type === 'marriage' || certificate?.type === 'marriage' ? 'certificate-marriage' :
                                certificate?.certificate_type === 'death' || certificate?.type === 'death' || certificate?.type === 'funeral' || (recordType === 'parish-record' && (certificate?.type === 'funeral' || certificate?.type === 'death' || certificate?.certificate_type === 'death')) ? 'certificate-death' : ''
                            }`}
                            style={{
                                width: (isParishRecord || certificate?.certificate_type === 'marriage') ? '794px' : (template?.template_data?.dimensions?.width || 800),
                                height: (isParishRecord || certificate?.certificate_type === 'marriage') ? '1123px' : (template?.template_data?.dimensions?.height || 600),
                                background: '#FFFFFF',
                                borderRadius: '0',
                                boxShadow: 'none',
                                border: '1px solid #000000',
                                position: 'relative',
                                overflow: 'visible',
                                margin: (isParishRecord || certificate?.certificate_type === 'marriage') ? '0 auto' : '0',
                                boxSizing: 'border-box'
                            }}
                        >
                            {templateElements.map((element, index) => renderElement(element, index))}
                        </div>
                    </div>
                    
                    {/* ElementEditor removed - using inline editing instead */}
                </div>
            </div>
        </div>
    );
};

export default CertificateGenerator;