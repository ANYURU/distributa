import { useCallback, use } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useOrganisationData } from "./useOrganisationData";

export function useOrganisationView() {
  const { organisation: organisationPromise } = useLoaderData();
  const resolvedOrganisation = use(organisationPromise);
  const { organisation, fetcher, isLoading } =
    useOrganisationData(resolvedOrganisation);

  const navigate = useNavigate();

  const actions = {
    updateDetails: useCallback(
      (data) => {
        if (!organisation.$id) return;

        fetcher.submit(data, {
          method: "patch",
          action: `/settings/organisations/${organisation.$id}/edit`,
        });
      },
      [fetcher, organisation]
    ),
    deleteOrganisation: useCallback(() => {
      if (!organisation.$id) return;

      fetcher.submit(null, {
        method: "delete",
        action: `/settings/organisations/${organisation.$id}/delete`,
      });
    }, [fetcher, organisation]),

    navigateToEdit: useCallback(() => {
      if (!organisation.$id) return;

      navigate(`/settings/organisations/${organisation.$id}/edit`);
    }, [navigate, organisation]),

    navigateToView: useCallback(() => {
      if (!organisation.$id) return;

      navigate(`/settings/organisations/${organisation.$id}`);
    }, [navigate, organisation]),

    navigateToCreate: useCallback(() => {
      navigate("/settings/organisations/new");
    }, [navigate]),
  };

  return {
    organisation,
    isLoading,
    actions,
  };
}
