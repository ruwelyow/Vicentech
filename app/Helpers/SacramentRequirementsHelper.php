<?php

namespace App\Helpers;

class SacramentRequirementsHelper
{
    /**
     * Get requirements for a sacrament type
     * 
     * @param string $sacramentTypeName
     * @return array
     */
    public static function getRequirements($sacramentTypeName)
    {
        // First, try to get requirements from the database
        $sacramentType = \App\Models\SacramentType::where('name', $sacramentTypeName)->first();

        if ($sacramentType && !empty($sacramentType->requirements)) {
            // Parse the requirements from the database (assuming it's stored as a newline-separated string)
            return array_filter(array_map('trim', explode("\n", $sacramentType->requirements)));
        }

        // Fallback to hardcoded requirements for backward compatibility
        $requirements = [];

        // Normalize the sacrament type name for comparison
        $type = strtolower(trim($sacramentTypeName));

        switch ($type) {
            case 'baptism':
                $requirements = [
                    'Birth Certificate',
                    'Marriage Contract of Parents'
                ];
                break;

            case 'marriage':
            case 'matrimony':
                $requirements = [
                    'Baptismal Certificate',
                    'Confirmation Certificate',
                    'PSA Birth Certificate',
                    'CENOMAR (Certificate of No Marriage)',
                    'Marriage License (from the Local Civil Registrar)',
                    'Two (2) pieces of 2x2 ID photo'
                ];
                break;

            case 'funeral mass':
            case 'funeral':
                $requirements = [
                    'Death Certificate'
                ];
                break;

            case 'house blessing':
                $requirements = [
                    'Schedule at the parish office and provide the complete house address'
                ];
                break;

            case 'certificate request':
            case 'certificate':
                $requirements = [
                    'Visit the parish office and provide the name of the person requesting the certificate'
                ];
                break;

            case 'confirmation':
                $requirements = [
                    'Baptismal Certificate',
                    'Confirmation Certificate (if previously confirmed)'
                ];
                break;

            case 'eucharist':
            case 'first communion':
                $requirements = [
                    'Baptismal Certificate',
                    'Confirmation Certificate (if applicable)'
                ];
                break;

            case 'confession':
            case 'reconciliation':
                $requirements = [
                    'No specific documents required. Please prepare spiritually for the sacrament.'
                ];
                break;

            case 'anointing':
            case 'anointing of the sick':
                $requirements = [
                    'Medical certificate or doctor\'s note (if applicable)'
                ];
                break;

            default:
                $requirements = [
                    'Please contact the parish office for specific requirements'
                ];
                break;
        }

        return $requirements;
    }
}

