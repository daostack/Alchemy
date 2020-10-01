import * as React from "react";
import i18next from "i18next";
import { ErrorMessage, Field } from "formik";
import * as css from "./SelectSearch.scss";

/**
 * Generic Select with Search for formik forms.
 *
 * data - Objects array
 * nameOnList - the property name which will be displayd on the select list
 * label - select input label name
 * name - 'name' attribute in the parent form
 * required (true / false)
 * onChange - function to trigger on select. Also returns the whole selected element.
 * placeholder [optional]
 * errors - errors attribute of the parent form
 * cssForm - css styles of the parent form
 * touched - touched attribute of the parent form
 */

interface IProps {
  data: Array<any>
  label: string
  name: string
  required: boolean
  onChange: any
  placeholder?: string
  errors: any
  cssForm: any
  touched: any
  nameOnList: string
}

export const SelectSearch = (props: IProps): React.ReactElement => {
  const [toggle, setToggle] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [value, setValue] = React.useState(`-- ${i18next.t("Choose")} --`);
  const { data, label, required, onChange, name, placeholder, errors, cssForm, touched, nameOnList } = props;

  const handleSelect = (element: any) => {
    setValue(element.name);
    setToggle(false);
    setSearch("");
    onChange(element);
  };

  const elements: any = [];

data?.forEach((element: any, index: number) => {
  if (element.name.toLowerCase().includes(search.toLowerCase())){
    // eslint-disable-next-line react/jsx-no-bind
    elements.push(<div key={index} className={css.element} onClick={() => handleSelect(element)}>{element[nameOnList]}</div>);
  }
});

return (
  <div className={css.selectSearchWrapper}>
    {/* eslint-disable-next-line react/jsx-no-bind */}
    <div className={css.dropdownSelection} onClick={() => setToggle(!toggle)} id="select-search" >
      <label htmlFor={name} style={{ width: "100%" }}>
        {required && <div className={cssForm.requiredMarker}>*</div>}
        {label}
        <ErrorMessage name={name}>{(msg: string) => <span className={cssForm.errorMessage}>{msg}</span>}</ErrorMessage>
        <Field
          name={name}
          placeholder={placeholder}
          type="text"
          value={value}
          disabled="true"
          className={touched.name && errors.name ? cssForm.error : null} />
      </label>
      <div className={css.arrow} />
    </div>
    {toggle &&
    <div className={css.dropdownOpen}>
      {/* eslint-disable-next-line react/jsx-no-bind */}
      <input className={css.search} type="text" placeholder={i18next.t("Search")} onChange={e => setSearch(e.target.value)} autoFocus />
      <div className={css.elementsWrapper}>
        {elements.length === 0 ? <div className={css.noResults}>{i18next.t("No Results")}</div> : elements}
      </div>
    </div>}
  </div>
);
};
