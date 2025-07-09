import { useCallback } from "react";
import { useFormikContext } from "formik";
import { AsyncSelect } from ".";
import { Query } from "appwrite";
import { appwriteConfig } from "../../../lib/appwrite/config";
import { databases, account } from "../../../lib/appwrite/client";

const ContactSelect = (props) => {
  const formikContext = useFormikContext();
  const { setFieldValue } = formikContext;

  const generateOption = (option) => ({
    value: option.$id,
    label: <div className="p-3 font-satoshi text-tiny">{option.name}</div>,
  });

  const loadOptions = useCallback(async (inputValue) => {
    const currentPartyId = newPartyIdRef.current;

    try {
      const { $id: userId } = await account.get();
      const queries = [
        Query.limit(100),
        Query.equal("created_by", userId),
        Query.orderAsc("name"),
        Query.orderDesc("$createdAt"),
      ];

      if (inputValue) {
        queries.push(Query.contains("name", inputValue));
      }

      if (currentPartyId) {
        queries.push(Query.equal("$id", currentPartyId));
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.parties,
        queries
      );

      if (response?.total > 0) {
        return [...response.documents.map(generateOption)];
      }

      return [];
    } catch (error) {
      return [];
    }
  }, []);

  const handleChange = (selectedOption) => {
    if (selectedOption) {
      setFieldValue(props.name, selectedOption.value);
      return;
    }

    setFieldValue(props.name, "");
  };

  return (
    <AsyncSelect
      handleChange={handleChange}
      loadOptions={loadOptions}
      defaultOptions={true}
      cacheOptions={false}
      {...props}
    />
  );
};

export default ContactSelect;
