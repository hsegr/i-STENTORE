#!/usr/bin/env python3
import json
import requests
#from rdflib import Graph, URIRef, RDF #For handling OWL, TTL
from pyld import jsonld #For handling JSON-LD 
import kong_pdk.pdk.kong as kong

Schema = (
    {"ontology_url": {"type": "string", "required": True}},
)

version = "0.1.0"
priority = 0

class Plugin(object):
    def __init__(self, config: dict[str, str]):
        self.config = config
        self.ontology_url: str | None = config.get("ontology_url")
        self.ontology_terms: dict[str, str] = {}  # To hold @id to @type mapping
        self.link_header_url: str | None = None


    def load_ontology(self, ontology_url: str) -> bool:
        """Loads the ontology from a URL."""
        try:
            response = requests.get(ontology_url)
            response.raise_for_status()
            context = response.json()

            context = context['@context']

            # Extract the @context, which could reference other ontologies
            if isinstance(context, list):
                # Multiple @context entries, process each URL
                for context_url in context:
                    if isinstance(context_url, str):
                        if not self.load_ontology(context_url):  # Recursively load each ontology
                            return False
            elif isinstance(context, dict):
                # Process key-value pairs in a single @context
                for key, value in context.items():
                    self.ontology_terms[key] = value
            else:
                raise ValueError("Invalid @context format, expected a list or dictionary.")
            
            return True
        except Exception as e:
            print(f"Error loading ontology from {ontology_url}: {e}")
            return None

    def validate_link_header(self, link_header: str) -> bool:
        """Extracts the ontology URL from the Link header and validates it against the configured ontology URL."""
    
        # Split the link header on ';' to extract the URL and rel attribute
        parts = link_header.split(';')

        if len(parts) > 1:
            # Extract the URL part (enclosed in angle brackets)
            self.link_header_url = parts[0].strip('<> ')
            
            # Check if the 'rel' part indicates that it's a JSON-LD context
            if 'rel="http://www.w3.org/ns/json-ld#context"' in parts[1]:
                # Compare the extracted URL with the configured ontology URL
                if self.link_header_url != self.ontology_url:
                    return False
                    
                # If the URL matches, proceed to load the ontology
                return True
        
        # If no valid ontology URL is found in the Link header
        return False
    
    def validate_payload_against_ontology(self, body: dict, method: str) -> tuple[bool, str]:
        """Check if the payload conforms to the ontology."""
        
        # Check if the payload type matches an ontology class (POST, PUT Requests are required to specify the type, PATCH Requests have it optionally)
        payload_type = body.get('type')

        if method == 'PATCH' and payload_type is None:
            pass
        else:
            if payload_type not in self.ontology_terms:
                return False, f"Type '{payload_type}' is not defined in the ontology."

        # Check if each attribute is defined in the ontology with correct type
        for key, value in body.items():
            if key in ['id', 'type']:  # Skip validation for 'id' and 'type'
                continue

            # Validate that the attribute is part of the ontology
            if key not in self.ontology_terms:
                return False, f"Attribute '{key}' is not defined in the ontology."
            
            # Validate that the attribute type is Property, GeoProperty, or Relationship
            if isinstance(value, dict):
                attribute_type = value.get('type')
                if attribute_type not in ['Property', 'GeoProperty', 'Relationship']:
                    return False, f"Attribute '{key}' has incorrect type. Expected 'Property', 'GeoProperty', or 'Relationship', found '{attribute_type}'"
                
                # Recursively check sub-attributes if they exist (FOR FUTURE USE PROBABLY)
                #is_valid, error_message = self.validate_payload_against_ontology(value)
                #if not is_valid:
                    #return False, error_message
    
        return True, ""
        
    #Calls load_ontology and validate_body_against_ontology
    def access(self, kong: kong.kong) -> None:            
        """Validates the request body against the loaded ontology."""
        method = kong.request.get_method()
        if method not in ["POST", "PUT", "PATCH"]:
            return

        link_header = kong.request.get_header("Link")

        if not link_header:
            kong.response.exit(400, {"message": "Link header missing."})

        # Validate the Link header against the ontology URL
        if not self.validate_link_header(link_header):
            kong.response.exit(400, {"message": f"Link header URL: {self.link_header_url} does not match ontology URL: {self.ontology_url}."})

        # Load the ontology after successful link header validation
        if not self.load_ontology(self.ontology_url):
            kong.response.exit(500, {"message": "Failed to load ontology from URL."})

        content_type = kong.request.get_header("Content-Type")

        #Parse body based on Content-Type
        if "application/json" in content_type:
            try:
                raw_body = kong.request.get_raw_body()
                if not raw_body:
                    kong.response.exit(400, {"message": "Invalid or missing request body."})

                # Ensure raw_body is in string format
                body_str = raw_body.decode('utf-8')

                # Parse the JSON body
                body = json.loads(body_str)
            except json.JSONDecodeError:
                kong.response.exit(400, {"message": "Invalid JSON format."})
        else:
            kong.response.exit(415, {"message": "Unsupported Media Type."})

        if not self.ontology_url:
            kong.response.exit(500, {"message": "Ontology URL not configured."})

        #self.ontology = self.load_ontology(self.ontology_url)
        #if not self.ontology:
            #kong.response.exit(500, {"message": "Failed to load ontology from URL."})

        # If the body is a list, validate each entity separately
        if isinstance(body, list):
            for entity in body:
                is_valid, error_message = self.validate_payload_against_ontology(entity, method)
                if not is_valid:
                    kong.response.exit(400, {"message": f"Ontology validation failed: {error_message} | {self.ontology_terms}"})
        else:
            # Validate a single entity
            is_valid, error_message = self.validate_payload_against_ontology(body, method)
            if not is_valid:
                kong.response.exit(400, {"message": f"Ontology validation failed: {error_message} | {self.ontology_terms}"})


if __name__ == "__main__":
    from kong_pdk.cli import start_dedicated_server
    start_dedicated_server("validator-plugin", Plugin, version, priority, Schema)
