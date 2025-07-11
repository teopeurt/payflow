create or replace function public.maintain_profile_organization_consistency() returns trigger
    language plpgsql
as
$$
BEGIN
    -- If a user's primary organization is set/changed, update their profile
    IF NEW.is_primary = true THEN
        -- Update the profile organization_id to match the primary organization
        UPDATE public.profiles
        SET organization_id = NEW.organization_id
        WHERE id = NEW.user_id;
        
        -- Ensure only one organization is primary for this user
        UPDATE public.organization_members
        SET is_primary = false
        WHERE user_id = NEW.user_id 
          AND id != NEW.id
          AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$;

alter function public.maintain_profile_organization_consistency() owner to postgres;

grant execute on function public.maintain_profile_organization_consistency() to anon;

grant execute on function public.maintain_profile_organization_consistency() to authenticated;

grant execute on function public.maintain_profile_organization_consistency() to service_role;

